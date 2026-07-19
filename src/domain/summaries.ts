import { calculateShift } from './calculateShift'
import { hourlyRatePenceForDate } from './money'
import type { PayRules, PlannerSettings, Shift } from './types'

export function includedShifts(shifts: Shift[]) {
  return shifts.filter((shift) => shift.status !== 'cancelled')
}

export function totalFor(shifts: Shift[], rules: PayRules) {
  return includedShifts(shifts).reduce(
    (summary, shift) => {
      const result = calculateShift(shift, rules)
      summary.grossPence += result.grossPence
      summary.hours += result.paidHours
      summary.holidayHours += result.holidayHours
      return summary
    },
    { grossPence: 0, hours: 0, holidayHours: 0 },
  )
}

export function assessmentSummary(shifts: Shift[], rules: PayRules, settings: PlannerSettings) {
  const inPeriod = shifts.filter(
    (shift) => shift.date >= settings.assessmentStart && shift.date <= settings.assessmentEnd,
  )
  const workedGrossPence = totalFor(inPeriod.filter((shift) => shift.status === 'worked'), rules).grossPence
  const plannedGrossPence = totalFor(inPeriod.filter((shift) => shift.status === 'planned'), rules).grossPence
  const shiftGrossPence = workedGrossPence + plannedGrossPence
  const baseRatePence = hourlyRatePenceForDate(rules, settings.assessmentEnd)
  const holidayIsDatedInPeriod = Boolean(
    settings.manualHolidayDate
    && settings.manualHolidayDate >= settings.assessmentStart
    && settings.manualHolidayDate <= settings.assessmentEnd,
  )
  const manualHolidayGrossPence = holidayIsDatedInPeriod
    ? Math.round(settings.manualHolidayHours * hourlyRatePenceForDate(rules, settings.manualHolidayDate))
    : 0
  const grossPence = shiftGrossPence + manualHolidayGrossPence
  const differencePence = grossPence - settings.assessmentTargetPence
  const bufferHours = baseRatePence > 0 ? differencePence / baseRatePence : 0
  return {
    workedGrossPence,
    plannedGrossPence,
    shiftGrossPence,
    manualHolidayGrossPence,
    grossPence,
    targetPence: settings.assessmentTargetPence,
    differencePence,
    bufferHours,
    progress: settings.assessmentTargetPence > 0 ? Math.min(1, grossPence / settings.assessmentTargetPence) : 0,
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
    earningsChangePence: projected.grossPence - current.grossPence,
    paidHoursChange: projectedHours - currentHours,
  }
}
