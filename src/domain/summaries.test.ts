import { describe, expect, it } from 'vitest'
import { defaultState } from '../data/defaults'
import { defaultPayRules } from './rules'
import { assessmentSummary } from './summaries'

describe('Loren assessment seed data', () => {
  it('includes confirmed work, the bounded calendar snapshot and 3.25 holiday hours', () => {
    const summary = assessmentSummary(defaultState.shifts, defaultPayRules, defaultState.settings)
    expect(defaultState.shifts).toHaveLength(19)
    expect(defaultState.shifts.some((shift) => shift.date === '2026-08-30')).toBe(true)
    expect(defaultState.settings.manualHolidayHours).toBe(3.25)
    expect(summary.shiftGross).toBeCloseTo(2719.01, 2)
    expect(summary.manualHolidayGross).toBeCloseTo(58.175, 3)
    expect(summary.gross).toBeCloseTo(2777.185, 3)
    expect(summary.difference).toBeCloseTo(133.505, 3)
  })
})
