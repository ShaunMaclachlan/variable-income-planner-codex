import type { PlannerState, Shift } from '../domain/types'
import { calendarEventToShift } from '../domain/calendarShift'
import { calendarShiftEvents } from './calendarSnapshot'

export const templates = {
  Early: { start: '07:00', end: '15:00', breakMinutes: 60 },
  Late: { start: '13:00', end: '21:00', breakMinutes: 60 },
  'Long day': { start: '07:00', end: '20:00', breakMinutes: 60 },
  Night: { start: '19:00', end: '07:30', breakMinutes: 60 },
  Training: { start: '13:30', end: '15:30', breakMinutes: 0 },
} as const

export type TemplateName = keyof typeof templates

const verifiedShifts: Shift[] = [
  { id: '2026-06-15-early', label: 'Early', date: '2026-06-15', start: '07:00', end: '15:00', breakMinutes: 60, status: 'worked', source: 'confirmed' },
  { id: '2026-06-16-early', label: 'Early', date: '2026-06-16', start: '07:00', end: '15:00', breakMinutes: 60, status: 'worked', source: 'confirmed' },
  { id: '2026-06-23-early', label: 'Early', date: '2026-06-23', start: '07:00', end: '15:00', breakMinutes: 60, status: 'worked', source: 'confirmed' },
  { id: '2026-06-27-early', label: 'Early', date: '2026-06-27', start: '07:00', end: '15:00', breakMinutes: 60, status: 'worked', source: 'confirmed' },
  { id: '2026-06-28-late', label: 'Late', date: '2026-06-28', start: '13:00', end: '20:00', breakMinutes: 60, status: 'worked', source: 'confirmed' },
  { id: '2026-06-30-late', label: 'Late', date: '2026-06-30', start: '13:00', end: '20:00', breakMinutes: 60, status: 'worked', source: 'confirmed' },
]

const calendarShifts = calendarShiftEvents.map(calendarEventToShift).filter((shift): shift is Shift => shift !== null)

export const defaultState: PlannerState = {
  shifts: [...verifiedShifts, ...calendarShifts],
  settings: {
    assessmentStart: '2026-06-09',
    assessmentEnd: '2026-09-09',
    assessmentTarget: 2643.68,
    manualHolidayHours: 3.25,
  },
}
