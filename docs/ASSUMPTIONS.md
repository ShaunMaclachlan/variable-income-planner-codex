# Calculation decisions and evidence status

The domain engine is the only source of pay calculations. Repository data is fictional. These rules are planning hypotheses until a contract and real payslip independently confirm them.

## Money and rate history

- The agreed pilot configuration starts at **£17.90/hour** (stored as **1,790 pence**).
- Every monetary input and result is stored and summed as integer pence. Pounds exist only at the UI boundary.
- A shift is split at local-midnight, enhancement and effective-rate boundaries. Each segment is rounded independently to the nearest penny, half-penny upwards, then the integer-pence segments are summed.
- The segment-rounding point is provisional until a payslip confirms whether payroll rounds per segment, shift or pay period.
- Base rates are effective-dated. Adding a new rate never rewrites an earlier rate period.
- Weekday night hours are 20:00–07:00 at 1.3×; Saturday 1.3×; Sunday 1.6×; listed England-and-Wales public holidays 2×.
- Where enhancements overlap, the highest multiplier wins. Multipliers do not stack.
- Holiday accrual is configured as 1 hour per 8.2 paid hours. Its contractual source and payslip presentation remain unverified.
- No overtime premium is assumed.

## Shifts and breaks

- Early, late, long-day and night templates default to a 60-minute unpaid break.
- A recorded or imported break value is never increased silently.
- VIP does not infer that a training/study break is unpaid. A long training entry with no deduction is visibly flagged for confirmation.
- When a recorded break crosses pay bands, the current provisional policy deducts it from the highest-rate minutes first. This is a reconciliation blocker until payroll evidence confirms the treatment.
- A past planned shift remains planned. Passing its date is not evidence that it was worked; only an explicit user action may change the status.

## Calendar evidence

- Calendar start and finish times are authoritative import evidence. The title supplies only the recognised label and a default break.
- Any recognised event whose clock times differ from the matching template is flagged, with the source times preserved.
- Only exact calendar event identity can update an existing imported shift. A same-day/same-label event with another identity is flagged as a potential duplicate and is not applied.
- After a successful connection sync, VIP records the observed event identities. If one later disappears from the same feed and assessment window, VIP proposes marking it cancelled. It never deletes or cancels it without review.
- Manual, email-derived and explicitly confirmed records remain protected from calendar overwrites.
- Calendar sync is user-triggered and read-only. `.ics` file import is the fallback when browser CORS prevents subscription-link access.
- Recurrence rules are still warning-only; the first instance is parsed and `EXDATE` is not expanded. The pilot must verify that its source emits individual timed events.
- Calendar bearer links remain only in local browser state and are excluded from encrypted backups.

## Forecast presentation

- Dashboard totals separate earned/confirmed, planned and total forecast values. Planned work is never called recorded or earned.
- Cancelled shifts are excluded.
- Paid holiday contributes only when both hours and a work/payroll date are supplied. It then uses the effective base rate on that date and appears in the payroll forecast.
- Assessment membership is based on the work date. Payroll membership uses the provisional cutoff model below.
- Buffer hours are the monetary difference divided by the base rate effective at the assessment end. They are labelled base-rate-equivalent hours.

## Payroll hypotheses

- Cutoff is assumed to be the last Saturday of the month, inclusive.
- Work after cutoff is assumed to move to the following payroll.
- Payday is assumed to be the 25th, moved to the previous working day for weekends or configured public holidays.
- A cross-midnight shift is allocated using its start date.
- These rules must be checked against two real payslips before payroll timing is trusted.

## Time, storage and scope

- All shift boundaries use `Europe/London`; DST calculations use actual elapsed minutes.
- Local storage is schema-versioned and migrates earlier pound fields to integer pence.
- Pilot recovery is a passphrase-encrypted JSON export. It excludes the calendar URL. There is no pilot cloud sync or account recovery promise.
- Net pay, childcare eligibility decisions, email OAuth and automatic application of source changes are deliberately omitted until gross-pay trust is evidenced.
