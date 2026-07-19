import { describe, expect, it } from 'vitest'
import { calendarEventToShift, type CalendarShiftInput } from './calendarShift'

function event(overrides: Partial<CalendarShiftInput> = {}): CalendarShiftInput {
  return {
    id: 'calendar-fixture',
    summary: 'Early shift Example Employer',
    start: '2026-08-01T15:00:00+01:00',
    end: '2026-08-01T22:00:00+01:00',
    status: 'planned',
    ...overrides,
  }
}

describe('calendar shift wording policy', () => {
  it('preserves conflicting calendar hours for review', () => {
    expect(calendarEventToShift(event())).toMatchObject({ label: 'Early', start: '15:00', end: '22:00' })
  })

  it('keeps a recorded early finish when it is 1pm, 2pm or 3pm', () => {
    expect(calendarEventToShift(event({ end: '2026-08-01T14:00:00+01:00' }))).toMatchObject({ end: '14:00' })
  })

  it('uses a late title only as the label and preserves its recorded hours', () => {
    expect(calendarEventToShift(event({
      summary: 'Late shift - Example Employer',
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
    expect(calendarEventToShift(event({ summary: 'Summer picnic' }))).toBeNull()
  })

  it('does not assume an unpaid break for long work training', () => {
    expect(calendarEventToShift(event({
      summary: 'Equipment training',
      start: '2026-08-01T09:00:00+01:00',
      end: '2026-08-01T16:00:00+01:00',
    }))).toMatchObject({ breakMinutes: 0 })
  })

  it('accepts recognised shift wording for a generic work-calendar profile', () => {
    expect(calendarEventToShift(event({
      summary: 'Night shift',
      start: '2026-08-01T19:00:00+01:00',
      end: '2026-08-02T07:30:00+01:00',
    }), 'generic')).toMatchObject({ label: 'Night', start: '19:00', end: '07:30' })
  })

  it('still ignores unrelated entries in a generic work calendar', () => {
    expect(calendarEventToShift(event({ summary: 'Dentist appointment' }), 'generic')).toBeNull()
  })
})
