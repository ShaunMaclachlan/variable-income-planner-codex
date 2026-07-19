import { describe, expect, it } from 'vitest'
import { defaultState } from '../data/defaults'
import { applyCalendarSyncPlan, buildCalendarSyncPlan } from './calendarSync'
import type { CalendarShiftInput } from './calendarShift'
import type { Shift } from './types'

const changedMonday: CalendarShiftInput = {
  id: 'ics-monday',
  calendarEventId: 'apple-monday',
  summary: 'Early shift Example Employer',
  start: '2026-07-20T07:00:00+01:00',
  end: '2026-07-20T15:00:00+01:00',
  status: 'planned',
}

describe('calendar sync planning', () => {
  it('protects the confirmed email override from a conflicting calendar event', () => {
    const confirmedOverride: Shift = {
      id: 'confirmed-monday', label: 'Early', date: '2026-07-20', start: '07:00', end: '13:00',
      breakMinutes: 60, status: 'planned', source: 'email', calendarEventId: 'apple-monday',
    }
    const plan = buildCalendarSyncPlan([confirmedOverride], [changedMonday], '2026-06-09', '2026-09-09')
    expect(plan.protected).toHaveLength(1)
    expect(plan.protected[0].end).toBe('13:00')
    expect(plan.updates).toHaveLength(0)
  })

  it('adds new work shifts, ignores unrelated events and applies only reviewed changes', () => {
    const events: CalendarShiftInput[] = [
      { ...changedMonday, id: 'new-night', calendarEventId: 'new-night', summary: 'Night shift Example Employer', start: '2026-09-01T19:00:00+01:00', end: '2026-09-02T07:30:00+01:00' },
      { ...changedMonday, id: 'dentist', calendarEventId: 'dentist', summary: 'Dentist' },
    ]
    const plan = buildCalendarSyncPlan(defaultState.shifts, events, '2026-06-09', '2026-09-09')
    expect(plan.additions).toHaveLength(1)
    expect(plan.ignored).toBe(1)
    expect(applyCalendarSyncPlan(defaultState.shifts, plan)).toHaveLength(defaultState.shifts.length + 1)
  })

  it('does not infer that a past planned event was worked', () => {
    const past: CalendarShiftInput = {
      ...changedMonday,
      id: 'past-shift',
      calendarEventId: 'past-shift',
      start: '2026-07-10T07:00:00+01:00',
      end: '2026-07-10T15:00:00+01:00',
    }
    const plan = buildCalendarSyncPlan([], [past], '2026-06-09', '2026-09-09')
    expect(plan.additions[0].status).toBe('planned')
  })

  it('proposes cancellation when a previously imported event disappears', () => {
    const existing: Shift = {
      id: 'existing', label: 'Early', date: '2026-07-20', start: '07:00', end: '15:00',
      breakMinutes: 60, status: 'planned', source: 'calendar', calendarEventId: 'apple-monday',
    }
    const plan = buildCalendarSyncPlan([existing], [], '2026-06-09', '2026-09-09', [], 'generic', ['apple-monday'])
    expect(plan.removals).toHaveLength(1)
    expect(plan.removals[0].after.status).toBe('cancelled')
    expect(applyCalendarSyncPlan([existing], plan)[0].status).toBe('cancelled')
  })

  it('does not silently link a same-day same-label event with a different identity', () => {
    const existing: Shift = {
      id: 'existing', label: 'Early', date: '2026-07-20', start: '07:00', end: '13:00',
      breakMinutes: 60, status: 'planned', source: 'calendar', calendarEventId: 'different-id',
    }
    const plan = buildCalendarSyncPlan([existing], [changedMonday], '2026-06-09', '2026-09-09')
    expect(plan.potentialDuplicates).toHaveLength(1)
    expect(plan.additions).toHaveLength(0)
    expect(plan.updates).toHaveLength(0)
  })
})
