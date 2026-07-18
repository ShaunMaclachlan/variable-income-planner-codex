import { describe, expect, it } from 'vitest'
import { defaultState } from '../data/defaults'
import { defaultPayRules } from './rules'
import { assessmentSummary, shiftChangeSummary } from './summaries'

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
    expect(summary.bufferHours).toBeCloseTo(7.4584, 4)
  })

  it('shows the exact remaining buffer after changing a weekday early finish from 3pm to 1pm', () => {
    const existing = defaultState.shifts.find((shift) => shift.id === '2026-06-15-early')!
    const proposed = { ...existing, end: '13:00' }
    const change = shiftChangeSummary(
      defaultState.shifts,
      proposed,
      defaultPayRules,
      defaultState.settings,
      existing.id,
    )

    expect(change.earningsChange).toBeCloseTo(-35.8, 2)
    expect(change.paidHoursChange).toBe(-2)
    expect(change.projected.difference).toBeCloseTo(97.705, 3)
    expect(change.projected.bufferHours).toBeCloseTo(5.4584, 4)
  })
})
