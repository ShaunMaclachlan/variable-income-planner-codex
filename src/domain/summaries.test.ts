import { describe, expect, it } from 'vitest'
import { defaultState } from '../data/defaults'
import { defaultPayRules } from './rules'
import { assessmentSummary, shiftChangeSummary } from './summaries'

describe('anonymised default state', () => {
  it('starts without personal shifts or holiday entries', () => {
    const summary = assessmentSummary(defaultState.shifts, defaultPayRules, defaultState.settings)
    expect(defaultState.shifts).toHaveLength(0)
    expect(defaultState.settings.manualHolidayHours).toBe(0)
    expect(summary.grossPence).toBe(0)
    expect(summary.differencePence).toBe(-250000)
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

    expect(change.earningsChangePence).toBe(12530)
    expect(change.paidHoursChange).toBe(7)
    expect(change.projected.differencePence).toBe(-237470)
  })

  it('separates worked and planned money and includes holiday only when dated', () => {
    const worked = {
      id: 'worked', label: 'Early', date: '2026-07-07', start: '07:00', end: '15:00',
      breakMinutes: 60, status: 'worked' as const,
    }
    const planned = { ...worked, id: 'planned', date: '2026-07-08', status: 'planned' as const }
    const undated = assessmentSummary([worked, planned], defaultPayRules, {
      ...defaultState.settings, manualHolidayHours: 1, manualHolidayDate: '',
    })
    expect(undated).toMatchObject({ workedGrossPence: 12530, plannedGrossPence: 12530, manualHolidayGrossPence: 0 })

    const dated = assessmentSummary([worked, planned], defaultPayRules, {
      ...defaultState.settings, manualHolidayHours: 1, manualHolidayDate: '2026-07-09',
    })
    expect(dated.manualHolidayGrossPence).toBe(1790)
    expect(dated.grossPence).toBe(26850)
  })
})
