export type ShiftStatus = 'worked' | 'planned' | 'cancelled'
export type ShiftSource = 'confirmed' | 'calendar' | 'email' | 'manual'

export interface Shift {
  id: string
  label: string
  date: string
  start: string
  end: string
  breakMinutes: number
  status: ShiftStatus
  source?: ShiftSource
  sourceTitle?: string
  calendarEventId?: string
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
  manualHolidayHours: number
}

export interface PlannerProfile {
  id: string
  firstName: string
  employer: string
}

export interface CalendarConnection {
  kind: 'ics-url'
  name: string
  url: string
  lastSyncedAt?: string
}

export interface PlannerState {
  profile: PlannerProfile
  shifts: Shift[]
  settings: PlannerSettings
  payRules: PayRules
  calendarConnection?: CalendarConnection
}
