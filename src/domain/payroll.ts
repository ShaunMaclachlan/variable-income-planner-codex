import { DateTime } from 'luxon'
import type { PayRules, Shift } from './types'

function lastSaturdayOfMonth(date: DateTime) {
  let day = date.endOf('month').startOf('day')
  while (day.weekday !== 6) day = day.minus({ days: 1 })
  return day
}

export function forecastPayDate(shift: Shift, rules: PayRules) {
  const shiftDate = DateTime.fromISO(shift.date, { zone: rules.zone }).startOf('day')
  const cutoff = lastSaturdayOfMonth(shiftDate)
  const monthsAhead = shiftDate <= cutoff ? 1 : 2
  return shiftDate.plus({ months: monthsAhead }).set({ day: 25 }).toISODate()!
}

export function formatPayrollMonth(date: string) {
  return DateTime.fromISO(date).toFormat('LLLL yyyy')
}
