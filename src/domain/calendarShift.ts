import { DateTime } from 'luxon'
import { statutoryBreakMinutes } from './breaks'
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
const earlyFinishes = new Set(['13:00', '14:00', '15:00'])

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
  const common = {
    id: event.id,
    date: calendarStart.toISODate()!,
    status: event.status,
    source: event.confirmedEnd ? 'email' as const : 'calendar' as const,
    sourceTitle: title,
    calendarEventId: event.calendarEventId ?? event.id,
  }

  if (normalisedTitle.includes('early')) {
    const recordedFinish = event.confirmedEnd ?? calendarEnd.toFormat('HH:mm')
    return {
      ...common,
      label: 'Early',
      start: '07:00',
      end: earlyFinishes.has(recordedFinish) ? recordedFinish : '15:00',
      breakMinutes: 60,
    }
  }
  if (normalisedTitle.includes('late')) {
    return { ...common, label: 'Late', start: '12:00', end: '20:00', breakMinutes: 60 }
  }
  if (normalisedTitle.includes('long day')) {
    return { ...common, label: 'Long day', start: '07:00', end: '20:00', breakMinutes: 60 }
  }
  if (normalisedTitle.includes('night')) {
    return { ...common, label: 'Night', start: '19:00', end: '07:30', breakMinutes: 60 }
  }
  if (normalisedTitle.includes('training')) {
    const elapsedHours = calendarEnd.diff(calendarStart, 'hours').hours
    return {
      ...common,
      label: title,
      start: calendarStart.toFormat('HH:mm'),
      end: calendarEnd.toFormat('HH:mm'),
      breakMinutes: statutoryBreakMinutes(elapsedHours),
    }
  }
  return null
}
