import { describe, expect, it } from 'vitest'
import { defaultState } from '../data/defaults'
import { defaultPayRules } from './rules'
import { assessmentSummary, shiftChangeSummary } from './summaries'

describe('anonymised default state', () => {
  it('starts without personal shifts or holiday entries', () => {
    const summary = assessmentSummary(defaultState.shifts, defaultPayRules, defaultState.settings)
    expect(defaultState.shifts).toHaveLength(0)
    expect(defaultState.settings.manualHolidayHours).toBe(0)
    expect(summary.gross).toBe(0)
    expect(summary.difference).toBe(-2500)
  })

  it('shows the effect of adding a fictional weekday early shift', () => {
    const proposed = {
      id: 'fixture-early', label: 'Early', date: '2026-07-07', start: '07:00', end: '15:00',
      breakMinutes: 60, status: 'planned' as const, source: 'manual' as const,
    }
    const change = shiftChangeSummary(
      defaultState.shifts,
      proposed,
      defaultPayRules,
      defaultState.settings,
    )

    expect(change.earningsChange).toBeCloseTo(125.3, 2)
    expect(change.paidHoursChange).toBe(7)
    expect(change.projected.difference).toBeCloseTo(-2374.7, 2)
  })
})
