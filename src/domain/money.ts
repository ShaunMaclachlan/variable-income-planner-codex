import type { PayRatePeriod, PayRules } from './types'

export const PENCE_PER_POUND = 100

export function poundsToPence(pounds: number) {
  if (!Number.isFinite(pounds)) return 0
  return Math.round(pounds * PENCE_PER_POUND)
}

export function penceToPounds(pence: number) {
  return pence / PENCE_PER_POUND
}

export function formatPence(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(penceToPounds(pence))
}

export function normaliseRatePeriods(periods: PayRatePeriod[]) {
  const byDate = new Map<string, PayRatePeriod>()
  periods.forEach((period) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(period.effectiveFrom) && Number.isInteger(period.hourlyRatePence) && period.hourlyRatePence >= 0) {
      byDate.set(period.effectiveFrom, period)
    }
  })
  return [...byDate.values()].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
}

export function hourlyRatePenceForDate(rules: PayRules, date: string) {
  const periods = normaliseRatePeriods(rules.ratePeriods)
  const applicable = periods.filter((period) => period.effectiveFrom <= date).at(-1)
  if (!applicable) throw new Error(`No base hourly rate is effective on ${date}`)
  return applicable.hourlyRatePence
}

export function withRatePeriod(rules: PayRules, period: PayRatePeriod): PayRules {
  return {
    ...rules,
    ratePeriods: normaliseRatePeriods([...rules.ratePeriods, period]),
  }
}

export function roundSegmentGrossPence(paidMinutes: number, hourlyRatePence: number, multiplier: number) {
  const multiplierBasisPoints = Math.round(multiplier * 10_000)
  return Math.round((paidMinutes * hourlyRatePence * multiplierBasisPoints) / (60 * 10_000))
}
