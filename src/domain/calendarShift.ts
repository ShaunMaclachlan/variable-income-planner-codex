import { DateTime } from 'luxon'
import type { Shift, ShiftStatus } from './types'

export interface CalendarShiftInput {
  id: string
  summary: string
  start: string
  end: string
  status: ShiftStatus
  confirmedEnd?: string
  calendarEventId?: string
}

export type CalendarWorkMode = 'generic'

const ZONE = 'Europe/London'
const templateTimes: Record<string, { start: string; end: string; breakMinutes: number }> = {
  Early: { start: '07:00', end: '15:00', breakMinutes: 60 },
  Late: { start: '12:00', end: '20:00', breakMinutes: 60 },
  'Long day': { start: '07:00', end: '20:00', breakMinutes: 60 },
  Night: { start: '19:00', end: '07:30', breakMinutes: 60 },
}

function localDateTime(value: string) {
  const parsed = DateTime.fromISO(value, { setZone: true }).setZone(ZONE)
  if (!parsed.isValid) throw new Error(`Invalid calendar date/time: ${value}`)
  return parsed
}

export function calendarEventToShift(event: CalendarShiftInput, workMode: CalendarWorkMode = 'generic'): Shift | null {
  const title = event.summary.trim()
  const normalisedTitle = title.toLowerCase()
  const isGenericShiftEvent = /\b(early|late|long\s*day|night|training)\b/i.test(title)
  const isWorkEvent = workMode === 'generic' && isGenericShiftEvent
  if (!isWorkEvent) return null

  const calendarStart = localDateTime(event.start)
  const calendarEnd = localDateTime(event.end)
  const recordedEnd = event.confirmedEnd ?? calendarEnd.toFormat('HH:mm')
  const common = {
    id: event.id,
    date: calendarStart.toISODate()!,
    status: event.status,
    source: event.confirmedEnd ? 'email' as const : 'calendar' as const,
    sourceTitle: title,
    calendarEventId: event.calendarEventId ?? event.id,
  }

  if (normalisedTitle.includes('early')) {
    return {
      ...common,
      label: 'Early',
      start: calendarStart.toFormat('HH:mm'),
      end: recordedEnd,
      breakMinutes: 60,
    }
  }
  if (normalisedTitle.includes('late')) {
    return { ...common, label: 'Late', start: calendarStart.toFormat('HH:mm'), end: recordedEnd, breakMinutes: 60 }
  }
  if (normalisedTitle.includes('long day')) {
    return { ...common, label: 'Long day', start: calendarStart.toFormat('HH:mm'), end: recordedEnd, breakMinutes: 60 }
  }
  if (normalisedTitle.includes('night')) {
    return { ...common, label: 'Night', start: calendarStart.toFormat('HH:mm'), end: recordedEnd, breakMinutes: 60 }
  }
  if (normalisedTitle.includes('training')) {
    return {
      ...common,
      label: title,
      start: calendarStart.toFormat('HH:mm'),
      end: recordedEnd,
      breakMinutes: 0,
    }
  }
  return null
}

export function calendarTemplateWarning(shift: Shift) {
  const template = templateTimes[shift.label]
  if (!template || (shift.start === template.start && shift.end === template.end)) return null
  return `${shift.date} ${shift.label}: calendar time ${shift.start}–${shift.end} differs from the ${template.start}–${template.end} template. The calendar time has been preserved for review.`
}
