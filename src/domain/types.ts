export type ShiftStatus = 'worked' | 'planned' | 'cancelled'

export interface Shift {
  id: string
  label: string
  date: string
  start: string
  end: string
  breakMinutes: number
  overtimeMultiplier: number
  status: ShiftStatus
}

export interface PayRules {
  zone: string
  baseRate: number
  weekdayNightMultiplier: number
  saturdayMultiplier: number
  sundayMultiplier: number
  publicHolidayMultiplier: number
  nightStarts: string
  nightEnds: string
  holidayHoursPerPaidHours: number
  publicHolidayDates: string[]
}

export interface PaySegment {
  label: string
  startsAt: string
  endsAt: string
  elapsedHours: number
  paidHours: number
  multiplier: number
  overtimeMultiplier: number
  gross: number
}

export interface ShiftCalculation {
  elapsedHours: number
  paidHours: number
  gross: number
  holidayHours: number
  segments: PaySegment[]
}

export interface PlannerSettings {
  assessmentStart: string
  assessmentEnd: string
  assessmentTarget: number
  manualAssessmentEarnings: number
  takeHomeRetention: number
}

export interface PlannerState {
  shifts: Shift[]
  settings: PlannerSettings
}
