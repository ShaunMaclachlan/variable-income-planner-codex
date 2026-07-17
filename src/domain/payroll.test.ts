import { describe, expect, it } from 'vitest'
import { forecastPayDate } from './payroll'
import { defaultPayRules } from './rules'
import type { Shift } from './types'

const makeShift = (date: string): Shift => ({
  id: date,
  label: 'Test',
  date,
  start: '07:00',
  end: '15:00',
  breakMinutes: 60,
  overtimeMultiplier: 1,
  status: 'worked',
})

describe('payroll cutoff forecast', () => {
  it('includes the last Saturday in the following payroll', () => {
    expect(forecastPayDate(makeShift('2026-07-25'), defaultPayRules)).toBe('2026-08-25')
  })

  it('moves work after cutoff into the month-after-next payroll', () => {
    expect(forecastPayDate(makeShift('2026-07-26'), defaultPayRules)).toBe('2026-09-25')
  })
})
