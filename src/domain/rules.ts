import type { PayRules } from './types'

export const defaultPayRules: PayRules = {
  zone: 'Europe/London',
  baseRate: 17.9,
  weekdayNightMultiplier: 1.3,
  saturdayMultiplier: 1.3,
  sundayMultiplier: 1.6,
  publicHolidayMultiplier: 2,
  nightStarts: '20:00',
  nightEnds: '07:00',
  holidayHoursPerPaidHours: 1 / 8.2,
  publicHolidayDates: [
    '2026-01-01',
    '2026-04-03',
    '2026-04-06',
    '2026-05-04',
    '2026-05-25',
    '2026-08-31',
    '2026-12-25',
    '2026-12-28',
  ],
}
