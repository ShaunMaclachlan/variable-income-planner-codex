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
    overtimeMultiplier: 1,
    status: 'worked',
    ...overrides,
  }
}

describe('golden shift calculations', () => {
  it.each([
    ['weekday early', {}, 7, 125.3],
    ['Saturday early', { date: '2026-06-27' }, 7, 162.89],
    ['Sunday late', { date: '2026-06-28', start: '13:00', end: '20:00' }, 6, 171.84],
    [
      'Friday into Saturday',
      { date: '2026-07-10', start: '19:00', end: '07:00', breakMinutes: 30 },
      11.5,
      264.92,
    ],
    ['Sunday into Monday', { date: '2026-07-12', start: '23:00', end: '07:00' }, 7, 168.26],
    ['spring clock change', { date: '2026-03-28', start: '19:00', end: '07:00' }, 10, 264.92],
    ['autumn clock change', { date: '2026-10-24', start: '19:00', end: '07:00' }, 12, 322.2],
    ['weekday overtime', { overtimeMultiplier: 1.5 }, 7, 187.95],
    ['public holiday', { date: '2026-08-31' }, 7, 200.48],
  ])('%s', (_name, overrides, expectedHours, expectedGross) => {
    const result = calculateShift(shift(overrides), defaultPayRules)
    expect(result.paidHours).toBeCloseTo(expectedHours, 6)
    expect(result.gross).toBeCloseTo(expectedGross, 2)
  })

  it('accrues holiday from paid rather than elapsed hours', () => {
    const result = calculateShift(shift({}), defaultPayRules)
    expect(result.holidayHours).toBeCloseTo(7 / 8.2, 6)
  })

  it('uses actual elapsed hours across both clock changes', () => {
    expect(calculateShift(shift({ date: '2026-03-28', start: '19:00', end: '07:00' }), defaultPayRules).elapsedHours).toBe(11)
    expect(calculateShift(shift({ date: '2026-10-24', start: '19:00', end: '07:00' }), defaultPayRules).elapsedHours).toBe(13)
  })
})
