import type { CalendarShiftInput } from '../domain/calendarShift'

export const calendarSnapshotCheckedAt = '2026-07-18'
export const calendarSnapshotThrough = '2026-08-30'

export const calendarShiftEvents: CalendarShiftInput[] = [
  { id: '2026-07-06-training', summary: 'Syringe pump training', start: '2026-07-06T13:30:00+01:00', end: '2026-07-06T15:30:00+01:00', status: 'worked' },
  { id: '2026-07-07-early', summary: 'Early shift Phyllis Tuckwell', start: '2026-07-07T07:00:00+01:00', end: '2026-07-07T15:00:00+01:00', status: 'worked' },
  { id: 'cal-2026-07-15-late', summary: 'Late shift - Phyllis Tuckwell', start: '2026-07-15T14:00:00+01:00', end: '2026-07-15T20:00:00+01:00', status: 'worked' },
  { id: 'cal-2026-07-20-early', summary: 'Early shift Phyllis Tuckwell', start: '2026-07-20T07:00:00+01:00', end: '2026-07-20T15:00:00+01:00', confirmedEnd: '13:00', status: 'planned' },
  { id: 'cal-2026-07-26-late', summary: 'Late shift - Phyllis Tuckwell', start: '2026-07-26T13:00:00+01:00', end: '2026-07-26T21:00:00+01:00', status: 'planned' },
  { id: 'cal-2026-07-28-early', summary: 'Early shift Phyllis Tuckwell', start: '2026-07-28T07:00:00+01:00', end: '2026-07-28T15:00:00+01:00', status: 'planned' },
  { id: 'cal-2026-08-04-early', summary: 'Early shift Phyllis Tuckwell', start: '2026-08-04T07:00:00+01:00', end: '2026-08-04T15:00:00+01:00', status: 'planned' },
  { id: 'cal-2026-08-09-late', summary: 'Late shift - Phyllis Tuckwell', start: '2026-08-09T13:00:00+01:00', end: '2026-08-09T21:00:00+01:00', status: 'planned' },
  { id: 'cal-2026-08-11-late', summary: 'Late shift - Phyllis Tuckwell', start: '2026-08-11T12:00:00+01:00', end: '2026-08-11T20:00:00+01:00', status: 'planned' },
  { id: 'cal-2026-08-12-early', summary: 'Early shift Phyllis Tuckwell', start: '2026-08-12T07:00:00+01:00', end: '2026-08-12T14:00:00+01:00', status: 'planned' },
  { id: 'cal-2026-08-17-late', summary: 'Late shift - Phyllis Tuckwell', start: '2026-08-17T12:00:00+01:00', end: '2026-08-17T20:00:00+01:00', status: 'planned' },
  { id: 'cal-2026-08-19-late', summary: 'Late shift - Phyllis Tuckwell', start: '2026-08-19T13:00:00+01:00', end: '2026-08-19T21:00:00+01:00', status: 'planned' },
  { id: 'cal-2026-08-30-long', summary: 'Long day shift Phyllis Tuckwell', start: '2026-08-30T07:00:00+01:00', end: '2026-08-30T20:00:00+01:00', status: 'planned' },
]
