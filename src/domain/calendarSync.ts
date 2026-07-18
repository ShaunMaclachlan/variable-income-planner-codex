import { DateTime } from 'luxon'
import { calendarEventToShift, type CalendarShiftInput } from './calendarShift'
import type { Shift } from './types'

export interface CalendarUpdate {
  before: Shift
  after: Shift
}

export interface CalendarSyncPlan {
  additions: Shift[]
  updates: CalendarUpdate[]
  links: CalendarUpdate[]
  protected: Shift[]
  unchanged: number
  ignored: number
  warnings: string[]
}

const protectedSources = new Set(['email', 'manual', 'confirmed'])
const comparable = (shift: Shift) => [shift.date, shift.label, shift.start, shift.end, shift.breakMinutes, shift.status].join('|')

function findExisting(shifts: Shift[], incoming: Shift) {
  return shifts.find((shift) => shift.calendarEventId === incoming.calendarEventId)
    ?? shifts.find((shift) => shift.date === incoming.date && shift.label === incoming.label)
}

export function buildCalendarSyncPlan(
  existingShifts: Shift[],
  events: CalendarShiftInput[],
  assessmentStart: string,
  assessmentEnd: string,
  warnings: string[] = [],
  asOfDate: string = DateTime.now().setZone('Europe/London').toISODate()!,
): CalendarSyncPlan {
  const plan: CalendarSyncPlan = { additions: [], updates: [], links: [], protected: [], unchanged: 0, ignored: 0, warnings }

  events.forEach((event) => {
    const calendarShift = calendarEventToShift(event)
    if (!calendarShift || calendarShift.date < assessmentStart || calendarShift.date > assessmentEnd) {
      plan.ignored += 1
      return
    }
    const incoming = calendarShift.status === 'planned' && calendarShift.date < asOfDate
      ? { ...calendarShift, status: 'worked' as const }
      : calendarShift
    const existing = findExisting(existingShifts, incoming)
    if (!existing) {
      plan.additions.push(incoming)
      return
    }
    if (protectedSources.has(existing.source ?? '')) {
      plan.protected.push(existing)
      return
    }

    const after = {
      ...existing,
      ...incoming,
      id: existing.id,
      status: existing.status === 'worked' && incoming.status === 'planned' ? 'worked' as const : incoming.status,
    }
    if (comparable(existing) === comparable(after)) {
      if (existing.calendarEventId !== after.calendarEventId) plan.links.push({ before: existing, after })
      plan.unchanged += 1
      return
    }
    plan.updates.push({ before: existing, after })
  })

  return plan
}

export function applyCalendarSyncPlan(shifts: Shift[], plan: CalendarSyncPlan) {
  const updates = new Map([...plan.links, ...plan.updates].map((update) => [update.before.id, update.after]))
  return [
    ...shifts.map((shift) => updates.get(shift.id) ?? shift),
    ...plan.additions,
  ]
}
