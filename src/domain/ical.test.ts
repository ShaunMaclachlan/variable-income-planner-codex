import { describe, expect, it } from 'vitest'
import { normaliseCalendarUrl, parseIcsCalendar } from './ical'

const calendar = `BEGIN:VCALENDAR\r
VERSION:2.0\r
BEGIN:VEVENT\r
UID:shift-1@example.com\r
SUMMARY:Early shift Example\\, Employer\r
DTSTART;TZID=Europe/London:20260728T070000\r
DTEND;TZID=Europe/London:20260728T150000\r
STATUS:CONFIRMED\r
END:VEVENT\r
BEGIN:VEVENT\r
UID:holiday@example.com\r
SUMMARY:Holiday\r
DTSTART;VALUE=DATE:20260729\r
DTEND;VALUE=DATE:20260730\r
END:VEVENT\r
END:VCALENDAR`

describe('iCalendar parsing', () => {
  it('reads timed Apple/iCalendar events in Europe/London and skips all-day entries', () => {
    const result = parseIcsCalendar(calendar)
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      calendarEventId: 'shift-1@example.com',
      summary: 'Early shift Example, Employer',
      start: '2026-07-28T07:00:00.000+01:00',
      end: '2026-07-28T15:00:00.000+01:00',
      status: 'planned',
    })
    expect(result.warnings).toHaveLength(1)
  })

  it('accepts webcal links but rejects insecure non-calendar schemes', () => {
    expect(normaliseCalendarUrl('webcal://example.com/work.ics')).toBe('https://example.com/work.ics')
    expect(() => normaliseCalendarUrl('http://example.com/work.ics')).toThrow(/secure/)
  })
})
