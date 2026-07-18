import { describe, expect, it } from 'vitest'
import { calendarEventToShift, type CalendarShiftInput } from './calendarShift'

function event(overrides: Partial<CalendarShiftInput> = {}): CalendarShiftInput {
  return {
    id: 'calendar-fixture',
    summary: 'Early shift Phyllis Tuckwell',
    start: '2026-08-01T15:00:00+01:00',
    end: '2026-08-01T22:00:00+01:00',
    status: 'planned',
    ...overrides,
  }
}

describe('calendar shift wording policy', () => {
  it('uses an early title instead of conflicting calendar hours', () => {
    expect(calendarEventToShift(event())).toMatchObject({ label: 'Early', start: '07:00', end: '15:00' })
  })

  it('keeps a recorded early finish when it is 1pm, 2pm or 3pm', () => {
    expect(calendarEventToShift(event({ end: '2026-08-01T14:00:00+01:00' }))).toMatchObject({ end: '14:00' })
  })

  it('normalises a late title to the confirmed 12pm–8pm shift', () => {
    expect(calendarEventToShift(event({
      summary: 'Late shift - Phyllis Tuckwell',
      start: '2026-08-01T12:00:00+01:00',
      end: '2026-08-01T20:00:00+01:00',
    }))).toMatchObject({ label: 'Late', start: '12:00', end: '20:00' })
  })

  it('lets a confirmed email finish override the calendar finish', () => {
    expect(calendarEventToShift(event({ confirmedEnd: '13:00' }))).toMatchObject({
      label: 'Early',
      end: '13:00',
      source: 'email',
    })
  })

  it('excludes unrelated training entries', () => {
    expect(calendarEventToShift(event({ summary: 'Summer training' }))).toBeNull()
  })

  it('applies the 20-minute minimum assumption to long work training', () => {
    expect(calendarEventToShift(event({
      summary: 'Syringe pump training',
      start: '2026-08-01T09:00:00+01:00',
      end: '2026-08-01T16:00:00+01:00',
    }))).toMatchObject({ breakMinutes: 20 })
  })
})
