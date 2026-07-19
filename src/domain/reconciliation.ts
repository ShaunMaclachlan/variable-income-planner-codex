import type { Shift } from './types'

export interface GrossReconciliation {
  forecastGrossPence: number
  payslipGrossPence: number
  differencePence: number
  absoluteDifferencePence: number
  tolerancePence: number
  withinTolerance: boolean
}

export interface ShiftLogDifference {
  key: string
  kind: 'missing-from-vip' | 'unexpected-in-vip' | 'changed'
  expected?: Shift
  actual?: Shift
  fields?: string[]
}

const comparedFields: Array<keyof Shift> = ['date', 'label', 'start', 'end', 'breakMinutes', 'status']

function evidenceKey(shift: Shift) {
  return shift.calendarEventId ?? shift.id
}

export function reconcileGross(forecastGrossPence: number, payslipGrossPence: number, tolerancePence = 100): GrossReconciliation {
  const differencePence = forecastGrossPence - payslipGrossPence
  const absoluteDifferencePence = Math.abs(differencePence)
  return {
    forecastGrossPence,
    payslipGrossPence,
    differencePence,
    absoluteDifferencePence,
    tolerancePence,
    withinTolerance: absoluteDifferencePence <= tolerancePence,
  }
}

export function compareShiftLog(expected: Shift[], actual: Shift[]): ShiftLogDifference[] {
  const expectedByKey = new Map(expected.map((shift) => [evidenceKey(shift), shift]))
  const actualByKey = new Map(actual.map((shift) => [evidenceKey(shift), shift]))
  const keys = new Set([...expectedByKey.keys(), ...actualByKey.keys()])

  const differences: ShiftLogDifference[] = []
  keys.forEach((key) => {
    const expectedShift = expectedByKey.get(key)
    const actualShift = actualByKey.get(key)
    if (!actualShift) {
      differences.push({ key, kind: 'missing-from-vip', expected: expectedShift })
      return
    }
    if (!expectedShift) {
      differences.push({ key, kind: 'unexpected-in-vip', actual: actualShift })
      return
    }
    const fields = comparedFields.filter((field) => expectedShift[field] !== actualShift[field])
    if (fields.length > 0) differences.push({ key, kind: 'changed', expected: expectedShift, actual: actualShift, fields })
  })
  return differences
}
