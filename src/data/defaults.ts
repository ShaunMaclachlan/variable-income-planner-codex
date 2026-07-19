import type { PlannerState } from '../domain/types'
import { poundsToPence } from '../domain/money'
import { defaultPayRules } from '../domain/rules'

export const templates = {
  Early: { start: '07:00', end: '15:00', breakMinutes: 60 },
  Late: { start: '12:00', end: '20:00', breakMinutes: 60 },
  'Long day': { start: '07:00', end: '20:00', breakMinutes: 60 },
  Night: { start: '19:00', end: '07:30', breakMinutes: 60 },
  Training: { start: '13:30', end: '15:30', breakMinutes: 0 },
} as const

export type TemplateName = keyof typeof templates

export const defaultState: PlannerState = {
  profile: {
    id: 'demo',
    firstName: 'Demo',
    employer: 'Example Employer',
  },
  shifts: [],
  settings: {
    assessmentStart: '2026-07-01',
    assessmentEnd: '2026-09-30',
    assessmentTargetPence: 250000,
    manualHolidayHours: 0,
    manualHolidayDate: '',
  },
  payRules: structuredClone(defaultPayRules),
}

export function newProfileState(profile: PlannerState['profile'], settings: PlannerState['settings'], baseRatePounds: number): PlannerState {
  return {
    profile,
    shifts: [],
    settings,
    payRules: {
      ...structuredClone(defaultPayRules),
      ratePeriods: [{ effectiveFrom: settings.assessmentStart, hourlyRatePence: poundsToPence(baseRatePounds) }],
      weekdayNightMultiplier: 1,
      saturdayMultiplier: 1,
      sundayMultiplier: 1,
      publicHolidayMultiplier: 1,
      holidayHoursPerPaidHours: 0,
    },
  }
}
