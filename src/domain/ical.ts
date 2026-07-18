import { DateTime } from 'luxon'
import type { CalendarShiftInput } from './calendarShift'

const DEFAULT_ZONE = 'Europe/London'

interface IcsProperty {
  value: string
  parameters: Record<string, string>
}

export interface ParsedCalendar {
  events: CalendarShiftInput[]
  warnings: string[]
}

function unfoldLines(source: string) {
  return source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '').split('\n')
}

function property(line: string): { name: string; property: IcsProperty } | null {
  const separator = line.indexOf(':')
  if (separator < 0) return null
  const left = line.slice(0, separator)
  const segments = left.split(';')
  const name = segments.shift()!.toUpperCase()
  const parameters = Object.fromEntries(segments.map((segment) => {
    const equals = segment.indexOf('=')
    return equals < 0
      ? [segment.toUpperCase(), '']
      : [segment.slice(0, equals).toUpperCase(), segment.slice(equals + 1).replace(/^"|"$/g, '')]
  }))
  return { name, property: { value: line.slice(separator + 1), parameters } }
}

function decodeText(value: string) {
  return value
    .replace(/\\[nN]/g, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function parseDateTime(entry: IcsProperty) {
  if (entry.parameters.VALUE?.toUpperCase() === 'DATE' || /^\d{8}$/.test(entry.value)) return null
  const zone = entry.parameters.TZID || DEFAULT_ZONE
  const isUtc = entry.value.endsWith('Z')
  const value = isUtc ? entry.value.slice(0, -1) : entry.value
  const format = value.length === 13 ? "yyyyMMdd'T'HHmm" : "yyyyMMdd'T'HHmmss"
  const parsed = DateTime.fromFormat(value, format, { zone: isUtc ? 'UTC' : zone })
  if (!parsed.isValid) return null
  return parsed.setZone(DEFAULT_ZONE).toISO()
}

function eventBlocks(source: string) {
  const blocks: string[][] = []
  let current: string[] | null = null
  unfoldLines(source).forEach((line) => {
    if (line.toUpperCase() === 'BEGIN:VEVENT') current = []
    else if (line.toUpperCase() === 'END:VEVENT' && current) {
      blocks.push(current)
      current = null
    } else if (current) current.push(line)
  })
  return blocks
}

export function parseIcsCalendar(source: string): ParsedCalendar {
  if (!/BEGIN:VCALENDAR/i.test(source)) throw new Error('This does not appear to be an iCalendar (.ics) calendar.')
  const warnings: string[] = []
  const events = eventBlocks(source).flatMap((block, index) => {
    const values = new Map<string, IcsProperty>()
    block.forEach((line) => {
      const parsed = property(line)
      if (parsed && !values.has(parsed.name)) values.set(parsed.name, parsed.property)
    })

    const uid = decodeText(values.get('UID')?.value ?? `event-${index + 1}`)
    const summary = decodeText(values.get('SUMMARY')?.value ?? '')
    const start = values.get('DTSTART') ? parseDateTime(values.get('DTSTART')!) : null
    const end = values.get('DTEND') ? parseDateTime(values.get('DTEND')!) : null
    if (values.has('RRULE')) warnings.push(`Recurring event “${summary || uid}” was read as its first occurrence only.`)
    if (!summary || !start || !end) {
      warnings.push(`Skipped calendar event “${summary || uid}” because it has no usable timed start and finish.`)
      return []
    }

    const recurrenceId = values.get('RECURRENCE-ID')?.value
    const eventId = recurrenceId ? `${uid}:${recurrenceId}` : uid
    return [{
      id: `ics-${eventId}`,
      calendarEventId: eventId,
      summary,
      start,
      end,
      status: values.get('STATUS')?.value.toUpperCase() === 'CANCELLED' ? 'cancelled' as const : 'planned' as const,
    }]
  })

  return { events, warnings }
}

export function normaliseCalendarUrl(value: string) {
  const trimmed = value.trim()
  const https = trimmed.replace(/^webcal:\/\//i, 'https://')
  const parsed = new URL(https)
  if (parsed.protocol !== 'https:') throw new Error('Use a secure https:// or webcal:// calendar link.')
  return parsed.toString()
}
