import { DateTime } from 'luxon'
import { hourlyRatePenceForDate, roundSegmentGrossPence } from './money'
import type { PayRules, PaySegment, Shift, ShiftCalculation } from './types'

interface RawSegment {
  label: string
  startsAt: DateTime
  endsAt: DateTime
  elapsedHours: number
  elapsedMinutes: number
  multiplier: number
  hourlyRatePence: number
}

export const CALCULATION_ENGINE_VERSION = '1.0.0'

function localDateTime(date: string, time: string, zone: string) {
  const value = DateTime.fromISO(`${date}T${time}`, { zone })
  if (!value.isValid) throw new Error(`Invalid local date/time: ${date} ${time}`)
  return value
}

function shiftBounds(shift: Shift, zone: string) {
  const start = localDateTime(shift.date, shift.start, zone)
  let end = localDateTime(shift.date, shift.end, zone)
  if (end <= start) end = end.plus({ days: 1 })
  return { start, end }
}

function timeMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function rateFor(point: DateTime, rules: PayRules) {
  const candidates: Array<{ multiplier: number; label: string }> = [
    { multiplier: 1, label: 'Basic' },
  ]
  const minute = point.hour * 60 + point.minute
  const nightStart = timeMinutes(rules.nightStarts)
  const nightEnd = timeMinutes(rules.nightEnds)
  if (minute >= nightStart || minute < nightEnd) {
    candidates.push({ multiplier: rules.weekdayNightMultiplier, label: 'Night' })
  }
  if (point.weekday === 6) {
    candidates.push({ multiplier: rules.saturdayMultiplier, label: 'Saturday' })
  }
  if (point.weekday === 7) {
    candidates.push({ multiplier: rules.sundayMultiplier, label: 'Sunday' })
  }
  if (rules.publicHolidayDates.includes(point.toISODate() ?? '')) {
    candidates.push({ multiplier: rules.publicHolidayMultiplier, label: 'Public holiday' })
  }
  return {
    ...candidates.sort((a, b) => b.multiplier - a.multiplier)[0],
    hourlyRatePence: hourlyRatePenceForDate(rules, point.toISODate()!),
  }
}

function boundariesBetween(start: DateTime, end: DateTime, rules: PayRules) {
  const boundaries = [start, end]
  let day = start.startOf('day')
  const finalDay = end.startOf('day')
  while (day <= finalDay) {
    for (const time of ['00:00', rules.nightEnds, rules.nightStarts]) {
      const boundary = localDateTime(day.toISODate()!, time, rules.zone)
      if (boundary > start && boundary < end) boundaries.push(boundary)
    }
    day = day.plus({ days: 1 })
  }
  return boundaries.sort((a, b) => a.toMillis() - b.toMillis())
}

function mergeAdjacent(segments: RawSegment[]) {
  return segments.reduce<RawSegment[]>((merged, segment) => {
    const previous = merged.at(-1)
    if (
      previous
      && previous.multiplier === segment.multiplier
      && previous.label === segment.label
      && previous.hourlyRatePence === segment.hourlyRatePence
    ) {
      previous.endsAt = segment.endsAt
      previous.elapsedHours += segment.elapsedHours
      previous.elapsedMinutes += segment.elapsedMinutes
    } else {
      merged.push({ ...segment })
    }
    return merged
  }, [])
}

export function calculateShift(shift: Shift, rules: PayRules): ShiftCalculation {
  if (!Number.isInteger(shift.breakMinutes) || shift.breakMinutes < 0) {
    throw new Error('Unpaid break must be a whole number of minutes')
  }
  const { start, end } = shiftBounds(shift, rules.zone)
  const boundaries = boundariesBetween(start, end, rules)
  const raw = mergeAdjacent(
    boundaries.slice(0, -1).map((segmentStart, index) => {
      const segmentEnd = boundaries[index + 1]
      const rate = rateFor(segmentStart, rules)
      return {
        label: rate.label,
        startsAt: segmentStart,
        endsAt: segmentEnd,
        elapsedMinutes: Math.round(segmentEnd.diff(segmentStart, 'minutes').minutes),
        elapsedHours: segmentEnd.diff(segmentStart, 'minutes').minutes / 60,
        multiplier: rate.multiplier,
        hourlyRatePence: rate.hourlyRatePence,
      }
    }),
  )

  const paidMinutes = raw.map((segment) => segment.elapsedMinutes)
  if (shift.breakMinutes > paidMinutes.reduce((total, minutes) => total + minutes, 0)) {
    throw new Error('Unpaid break cannot be longer than the shift')
  }
  let breakMinutes = shift.breakMinutes
  raw
    .map((segment, index) => ({ index, multiplier: segment.multiplier }))
    .sort((a, b) => b.multiplier - a.multiplier || a.index - b.index)
    .forEach(({ index }) => {
      if (breakMinutes <= 0) return
      const deduction = Math.min(paidMinutes[index], breakMinutes)
      paidMinutes[index] -= deduction
      breakMinutes -= deduction
    })

  const segments: PaySegment[] = raw.map((segment, index) => {
    const minutes = paidMinutes[index]
    return {
      label: segment.label,
      startsAt: segment.startsAt.toISO()!,
      endsAt: segment.endsAt.toISO()!,
      elapsedHours: segment.elapsedHours,
      paidHours: minutes / 60,
      paidMinutes: minutes,
      multiplier: segment.multiplier,
      hourlyRatePence: segment.hourlyRatePence,
      grossPence: roundSegmentGrossPence(minutes, segment.hourlyRatePence, segment.multiplier),
    }
  })
  const totalPaidHours = segments.reduce((total, segment) => total + segment.paidHours, 0)
  const grossPence = segments.reduce((total, segment) => total + segment.grossPence, 0)

  return {
    engineVersion: CALCULATION_ENGINE_VERSION,
    elapsedHours: end.diff(start, 'hours').hours,
    paidHours: totalPaidHours,
    grossPence,
    holidayHours: totalPaidHours * rules.holidayHoursPerPaidHours,
    segments,
  }
}
