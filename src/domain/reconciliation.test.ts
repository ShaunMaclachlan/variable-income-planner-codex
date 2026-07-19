import { describe, expect, it } from 'vitest'
import { compareShiftLog, reconcileGross } from './reconciliation'
import type { Shift } from './types'

const shift = (overrides: Partial<Shift> = {}): Shift => ({
  id: 'fixture', calendarEventId: 'source-1', label: 'Early', date: '2026-07-20', start: '07:00', end: '15:00',
  breakMinutes: 60, status: 'worked', source: 'calendar', ...overrides,
})

describe('pilot evidence reconciliation', () => {
  it('uses an explicit integer-pence tolerance', () => {
    expect(reconcileGross(12530, 12430)).toMatchObject({ differencePence: 100, withinTolerance: true })
    expect(reconcileGross(12530, 12429)).toMatchObject({ differencePence: 101, withinTolerance: false })
  })

  it('reports missing, unexpected and changed shifts against an independent log', () => {
    const differences = compareShiftLog(
      [shift(), shift({ id: 'missing', calendarEventId: 'source-2' })],
      [shift({ end: '13:00' }), shift({ id: 'unexpected', calendarEventId: 'source-3' })],
    )
    expect(differences).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'source-1', kind: 'changed', fields: ['end'] }),
      expect.objectContaining({ key: 'source-2', kind: 'missing-from-vip' }),
      expect.objectContaining({ key: 'source-3', kind: 'unexpected-in-vip' }),
    ]))
  })
})
