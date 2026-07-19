import { DateTime } from 'luxon'
import type { PayRules, Shift } from './types'

function lastSaturdayOfMonth(date: DateTime) {
  let day = date.endOf('month').startOf('day')
  while (day.weekday !== 6) day = day.minus({ days: 1 })
  return day
}

function previousWorkingDay(date: DateTime, rules: PayRules) {
  let candidate = date
  while (candidate.weekday > 5 || rules.publicHolidayDates.includes(candidate.toISODate()!)) {
    candidate = candidate.minus({ days: 1 })
  }
  return candidate
}

export function forecastPayDateForWorkDate(date: string, rules: PayRules) {
  const shiftDate = DateTime.fromISO(date, { zone: rules.zone }).startOf('day')
  const cutoff = lastSaturdayOfMonth(shiftDate)
  const monthsAhead = shiftDate <= cutoff ? 1 : 2
  const contractualPayDate = shiftDate.plus({ months: monthsAhead }).set({ day: 25 })
  return previousWorkingDay(contractualPayDate, rules).toISODate()!
}

export function forecastPayDate(shift: Shift, rules: PayRules) {
  return forecastPayDateForWorkDate(shift.date, rules)
}

export function formatPayrollMonth(date: string) {
  return DateTime.fromISO(date).toFormat('LLLL yyyy')
}
