import { describe, expect, it } from 'vitest'
import { defaultState } from '../data/defaults'
import { defaultPayRules } from './rules'
import { assessmentSummary } from './summaries'

describe('Loren assessment seed data', () => {
  it('contains only the confirmed work through 7 July plus the explicit holiday adjustment', () => {
    const summary = assessmentSummary(defaultState.shifts, defaultPayRules, defaultState.settings)
    expect(defaultState.shifts).toHaveLength(8)
    expect(defaultState.shifts.every((shift) => shift.date <= '2026-07-07')).toBe(true)
    expect(summary.shiftGross).toBeCloseTo(979.13, 2)
    expect(summary.gross).toBeCloseTo(1041.78, 2)
    expect(summary.difference).toBeCloseTo(-1601.9, 2)
  })
})
