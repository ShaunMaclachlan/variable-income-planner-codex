# Calculation decisions

The domain engine is the source of truth. These decisions reflect the contract information, the user's confirmations and the bounded calendar review completed on 18 July 2026.

## Pay and holiday

- Base rate: **£17.90/hour**.
- Weekday night hours are **20:00–07:00 at 1.3×**.
- Saturday hours are **1.3×**.
- Sunday hours are **1.6×**.
- Hours worked on an England and Wales public holiday are **2×**.
- Rates are applied per segment. Where rules overlap, the highest applicable multiplier wins.
- Holiday accrues at **1 hour per 8.2 paid hours**.
- No overtime premium is assumed or selectable because the contract does not define one.

## Shifts and breaks

- Normal early, late, long-day and night templates use a **60-minute unpaid break**.
- When a break crosses pay bands, it is deducted from the **highest-rate hours first**, as directly confirmed by the user.
- Early shifts start at 07:00 and can finish at **13:00, 14:00 or 15:00**.
- Late shifts are **12:00–20:00**, as directly confirmed by the user.
- Long days are 07:00–20:00 and nights are 19:00–07:30.
- For a training/study entry longer than six hours, the planner assumes a 20-minute unpaid break unless a different break is entered. GOV.UK says adult workers are usually entitled to a 20-minute break when working more than six hours, but whether it is paid depends on the contract and healthcare work can involve compensatory-rest rules: <https://www.gov.uk/rest-breaks-work>.

## Calendar wording policy

- The event title determines the shift type; conflicting calendar clock times do not change that type.
- An early event keeps its calendar finish only when that finish is 13:00, 14:00 or 15:00. Otherwise it defaults to 15:00.
- A confirmed email change overrides the recorded calendar finish. The Monday 20 July early shift is therefore recorded as finishing at 13:00.
- Late, long-day and night titles use the standard templates above.
- Work training keeps its recorded start and finish and uses the length-based break rule.
- Unrelated events such as sports training are excluded.
- The seed is a snapshot, not live sync. It contains relevant work entries reviewed through 30 August 2026.
- Until an email integration is designed, later changes are applied through Edit Shift and saved locally.

## Childcare and payroll

- The assessment period is **9 June–9 September 2026**, inclusive.
- The planning target is **£2,643.68**.
- Childcare progress uses expected earnings for shifts whose start date falls inside the assessment period, not the later cash pay date.
- July includes **3.25 paid-holiday hours** at base rate.
- Payroll cutoff is the last Saturday of the month, inclusive.
- A shift crossing the cutoff is allocated using its start date.
- Payday is the 25th, moved to the previous working day for a weekend or listed England and Wales public holiday.
- All time boundaries use `Europe/London`; daylight-saving transitions use actual elapsed time.

## Deliberately omitted

- Net pay is not estimated until a recent payslip is available to calibrate PAYE, National Insurance, pension and other deductions.
- The app forecasts; it does not guarantee childcare eligibility, a payslip value or tax treatment.
