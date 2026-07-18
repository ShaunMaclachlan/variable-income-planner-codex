export function statutoryBreakMinutes(elapsedHours: number) {
  return elapsedHours > 6 ? 20 : 0
}
