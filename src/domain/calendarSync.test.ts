import { describe, expect, it } from 'vitest'
import { defaultState } from '../data/defaults'
import { applyCalendarSyncPlan, buildCalendarSyncPlan } from './calendarSync'
import type { CalendarShiftInput } from './calendarShift'

const changedMonday: CalendarShiftInput = {
  id: 'ics-monday',
  calendarEventId: 'apple-monday',
  summary: 'Early shift Phyllis Tuckwell',
  start: '2026-07-20T07:00:00+01:00',
  end: '2026-07-20T15:00:00+01:00',
  status: 'planned',
}

describe('calendar sync planning', () => {
  it('protects the confirmed email override from a conflicting calendar event', () => {
    const plan = buildCalendarSyncPlan(defaultState.shifts, [changedMonday], '2026-06-09', '2026-09-09')
    expect(plan.protected).toHaveLength(1)
    expect(plan.protected[0].end).toBe('13:00')
    expect(plan.updates).toHaveLength(0)
  })

  it('adds new work shifts, ignores unrelated events and applies only reviewed changes', () => {
    const events: CalendarShiftInput[] = [
      { ...changedMonday, id: 'new-night', calendarEventId: 'new-night', summary: 'Night shift Phyllis Tuckwell', start: '2026-09-01T19:00:00+01:00', end: '2026-09-02T07:30:00+01:00' },
      { ...changedMonday, id: 'dentist', calendarEventId: 'dentist', summary: 'Dentist' },
    ]
    const plan = buildCalendarSyncPlan(defaultState.shifts, events, '2026-06-09', '2026-09-09')
    expect(plan.additions).toHaveLength(1)
    expect(plan.ignored).toBe(1)
    expect(applyCalendarSyncPlan(defaultState.shifts, plan)).toHaveLength(defaultState.shifts.length + 1)
  })

  it('marks past imported events as worked and never downgrades an existing worked shift', () => {
    const past: CalendarShiftInput = {
      ...changedMonday,
      id: 'past-shift',
      calendarEventId: 'past-shift',
      start: '2026-07-10T07:00:00+01:00',
      end: '2026-07-10T15:00:00+01:00',
    }
    const plan = buildCalendarSyncPlan([], [past], '2026-06-09', '2026-09-09', [], '2026-07-18')
    expect(plan.additions[0].status).toBe('worked')
  })
})
