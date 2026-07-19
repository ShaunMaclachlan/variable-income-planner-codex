import { describe, expect, it } from 'vitest'
import { calculateShift } from './calculateShift'
import { defaultPayRules } from './rules'
import type { Shift } from './types'

function shift(overrides: Partial<Shift>): Shift {
  return {
    id: 'fixture',
    label: 'Fixture',
    date: '2026-07-07',
    start: '07:00',
    end: '15:00',
    breakMinutes: 60,
    status: 'worked',
    ...overrides,
  }
}

describe('golden shift calculations', () => {
  it.each([
    ['weekday early', {}, 7, 12530],
    ['Saturday early', { date: '2026-06-27' }, 7, 16289],
    ['Sunday late', { date: '2026-06-28', start: '12:00', end: '20:00' }, 7, 20048],
    [
      'Friday into Saturday',
      { date: '2026-07-10', start: '19:00', end: '07:00', breakMinutes: 30 },
      11.5,
      26224,
    ],
    ['Sunday into Monday', { date: '2026-07-12', start: '23:00', end: '07:00' }, 7, 16289],
    ['spring clock change', { date: '2026-03-28', start: '19:00', end: '07:00' }, 10, 25955],
    ['autumn clock change', { date: '2026-10-24', start: '19:00', end: '07:00' }, 12, 31683],
    ['public holiday', { date: '2026-08-31' }, 7, 25060],
  ])('%s', (_name, overrides, expectedHours, expectedGrossPence) => {
    const result = calculateShift(shift(overrides), defaultPayRules)
    expect(result.paidHours).toBeCloseTo(expectedHours, 6)
    expect(result.grossPence).toBe(expectedGrossPence)
  })

  it('rounds each pay-rate segment to integer pence before summing the shift', () => {
    const result = calculateShift(shift({
      date: '2026-07-10', start: '19:00', end: '07:00', breakMinutes: 30,
    }), defaultPayRules)
    expect(result.segments.every((segment) => Number.isInteger(segment.grossPence))).toBe(true)
    expect(result.segments.reduce((total, segment) => total + segment.grossPence, 0)).toBe(result.grossPence)
    expect(result.grossPence).toBe(26224)
  })

  it.each([
    ['weekday early finish', { start: '07:00', end: '13:00', breakMinutes: 60 }, defaultPayRules, 8950],
    ['weekday overnight', { start: '19:00', end: '07:00', breakMinutes: 60 }, defaultPayRules, 25060],
    ['Saturday into Sunday', { date: '2026-07-11', start: '19:00', end: '07:00', breakMinutes: 60 }, defaultPayRules, 28819],
    ['thirty basic minutes', { start: '07:00', end: '07:30', breakMinutes: 0 }, defaultPayRules, 895],
    ['one enhanced minute', { start: '20:00', end: '20:01', breakMinutes: 0 }, defaultPayRules, 39],
    [
      'effective-dated rate across midnight',
      { date: '2026-07-10', start: '20:00', end: '02:00', breakMinutes: 0 },
      { ...defaultPayRules, ratePeriods: [...defaultPayRules.ratePeriods, { effectiveFrom: '2026-07-11', hourlyRatePence: 1800 }] },
      13988,
    ],
    [
      'public holiday precedence over Sunday',
      { date: '2026-07-12', start: '07:00', end: '08:00', breakMinutes: 0 },
      { ...defaultPayRules, publicHolidayDates: [...defaultPayRules.publicHolidayDates, '2026-07-12'] },
      3580,
    ],
  ])('%s has a hand-authored exact-pence result', (_name, overrides, rules, expectedGrossPence) => {
    expect(calculateShift(shift(overrides), rules).grossPence).toBe(expectedGrossPence)
  })

  it('accrues holiday from paid rather than elapsed hours', () => {
    const result = calculateShift(shift({}), defaultPayRules)
    expect(result.holidayHours).toBeCloseTo(7 / 8.2, 6)
  })

  it('deducts a cross-band break from the highest-rate segment first', () => {
    const result = calculateShift(shift({
      date: '2026-07-12',
      start: '23:00',
      end: '07:00',
      breakMinutes: 60,
    }), defaultPayRules)
    expect(result.segments.find((segment) => segment.label === 'Sunday')?.paidHours).toBe(0)
    expect(result.segments.find((segment) => segment.label === 'Night')?.paidHours).toBe(7)
  })

  it('uses actual elapsed hours across both clock changes', () => {
    expect(calculateShift(shift({ date: '2026-03-28', start: '19:00', end: '07:00' }), defaultPayRules).elapsedHours).toBe(11)
    expect(calculateShift(shift({ date: '2026-10-24', start: '19:00', end: '07:00' }), defaultPayRules).elapsedHours).toBe(13)
  })

  it('rejects a break longer than the shift instead of silently producing zero pay', () => {
    expect(() => calculateShift(shift({ start: '07:00', end: '07:30', breakMinutes: 60 }), defaultPayRules)).toThrow(/longer than the shift/i)
  })
})
