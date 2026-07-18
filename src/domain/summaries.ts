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
  const bufferHours = rules.baseRate > 0 ? difference / rules.baseRate : 0
  return {
    shiftGross,
    manualHolidayGross,
    gross,
    target: settings.assessmentTarget,
    difference,
    bufferHours,
    progress: settings.assessmentTarget > 0 ? Math.min(1, gross / settings.assessmentTarget) : 0,
  }
}

export function shiftChangeSummary(
  shifts: Shift[],
  proposed: Shift,
  rules: PayRules,
  settings: PlannerSettings,
  existingId?: string,
) {
  const projectedShifts = existingId
    ? shifts.map((shift) => shift.id === existingId ? proposed : shift)
    : [...shifts, proposed]
  const current = assessmentSummary(shifts, rules, settings)
  const projected = assessmentSummary(projectedShifts, rules, settings)
  const inPeriod = (shift: Shift) => shift.date >= settings.assessmentStart && shift.date <= settings.assessmentEnd
  const currentHours = totalFor(shifts.filter(inPeriod), rules).hours
  const projectedHours = totalFor(projectedShifts.filter(inPeriod), rules).hours

  return {
    current,
    projected,
    earningsChange: projected.gross - current.gross,
    paidHoursChange: projectedHours - currentHours,
  }
}
