import { calendarEventToShift, calendarTemplateWarning, type CalendarShiftInput, type CalendarWorkMode } from './calendarShift'
import type { Shift } from './types'

export interface CalendarUpdate {
  before: Shift
  after: Shift
}

export interface CalendarSyncPlan {
  additions: Shift[]
  updates: CalendarUpdate[]
  removals: CalendarUpdate[]
  links: CalendarUpdate[]
  protected: Shift[]
  potentialDuplicates: CalendarUpdate[]
  unchanged: number
  ignored: number
  warnings: string[]
  observedEventIds: string[]
}

const protectedSources = new Set(['email', 'manual', 'confirmed'])
const comparable = (shift: Shift) => [shift.date, shift.label, shift.start, shift.end, shift.breakMinutes, shift.status].join('|')

function findExisting(shifts: Shift[], incoming: Shift) {
  return shifts.find((shift) => shift.calendarEventId === incoming.calendarEventId)
}

export function buildCalendarSyncPlan(
  existingShifts: Shift[],
  events: CalendarShiftInput[],
  assessmentStart: string,
  assessmentEnd: string,
  warnings: string[] = [],
  workMode: CalendarWorkMode = 'generic',
  previousEventIds: string[] = [],
): CalendarSyncPlan {
  const plan: CalendarSyncPlan = {
    additions: [], updates: [], removals: [], links: [], protected: [], potentialDuplicates: [],
    unchanged: 0, ignored: 0, warnings: [...warnings], observedEventIds: [],
  }

  events.forEach((event) => {
    const calendarShift = calendarEventToShift(event, workMode)
    if (!calendarShift || calendarShift.date < assessmentStart || calendarShift.date > assessmentEnd) {
      plan.ignored += 1
      return
    }
    const incoming = calendarShift
    plan.observedEventIds.push(incoming.calendarEventId!)
    const templateWarning = calendarTemplateWarning(incoming)
    if (templateWarning) plan.warnings.push(templateWarning)
    const existing = findExisting(existingShifts, incoming)
    if (!existing) {
      const possibleDuplicate = existingShifts.find((shift) => shift.date === incoming.date && shift.label === incoming.label)
      if (possibleDuplicate) {
        plan.potentialDuplicates.push({ before: possibleDuplicate, after: incoming })
        return
      }
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

  const observed = new Set(plan.observedEventIds)
  previousEventIds.forEach((eventId) => {
    if (observed.has(eventId)) return
    const existing = existingShifts.find((shift) => (
      shift.calendarEventId === eventId
      && shift.source === 'calendar'
      && shift.status !== 'cancelled'
      && shift.date >= assessmentStart
      && shift.date <= assessmentEnd
    ))
    if (existing) plan.removals.push({ before: existing, after: { ...existing, status: 'cancelled' } })
  })

  return plan
}

export function applyCalendarSyncPlan(shifts: Shift[], plan: CalendarSyncPlan) {
  const updates = new Map([...plan.links, ...plan.updates, ...plan.removals].map((update) => [update.before.id, update.after]))
  return [
    ...shifts.map((shift) => updates.get(shift.id) ?? shift),
    ...plan.additions,
  ]
}
