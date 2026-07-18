import { calculateShift } from './calculateShift'
import type { PayRules, PlannerSettings, Shift } from './types'

export function includedShifts(shifts: Shift[]) {
  return shifts.filter((shift) => shift.status !== 'cancelled')
}

export function totalFor(shifts: Shift[], rules: PayRules) {
  return includedShifts(shifts).reduce(
    (summary, shift) => {
      const result = calculateShift(shift, rules)
      summary.gross += result.gross
      summary.hours += result.paidHours
      summary.holidayHours += result.holidayHours
      return summary
    },
    { gross: 0, hours: 0, holidayHours: 0 },
  )
}

export function assessmentSummary(shifts: Shift[], rules: PayRules, settings: PlannerSettings) {
  const inPeriod = shifts.filter(
    (shift) => shift.date >= settings.assessmentStart && shift.date <= settings.assessmentEnd,
  )
  const shiftGross = totalFor(inPeriod, rules).gross
  const manualHolidayGross = settings.manualHolidayHours * rules.baseRate
  const gross = shiftGross + manualHolidayGross
  const difference = gross - settings.assessmentTarget
  return {
    shiftGross,
    manualHolidayGross,
    gross,
    target: settings.assessmentTarget,
    difference,
    progress: settings.assessmentTarget > 0 ? Math.min(1, gross / settings.assessmentTarget) : 0,
  }
}
