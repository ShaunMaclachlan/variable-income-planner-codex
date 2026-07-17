# Calculation assumptions — review required

The engine makes these assumptions explicit so they can be corrected without rewriting the UI.

## Confirmed working assumptions

- Base rate: **£17.90/hour**.
- Normal shifts have a **60-minute unpaid break** unless changed.
- Two-hour training has no unpaid break.
- Saturday multiplier: **1.3×**.
- Sunday multiplier: **1.6×**.
- Weekday night multiplier: **1.3×**, currently 20:00–06:00.
- Enhancements apply to each segment of a shift, not the whole shift.
- Holiday accrues at **1 hour per 8.2 paid hours**.
- Payroll cutoff is the last Saturday of the month. Work on or before cutoff is forecast for the following month's payroll; later work for the month after that.
- All boundaries use `Europe/London` local time. DST shifts use actual elapsed time.

## Provisional assumptions

- Public holidays use **1.6×** and the highest applicable multiplier wins.
- If an unpaid break crosses rate bands, it is removed from the lowest-rate segment first. This avoids understating enhanced pay but needs confirmation against a payslip.
- Overtime multiplies the already enhanced segment rate.
- Indicative take-home uses a user-configurable retention percentage, initially 74%; it is not a PAYE calculation.
- The assessment period is 9 June–9 September 2026, inclusive.
- The assessment earnings target is **£2,643.68**. This must be checked against Loren's exact reconfirmation dates and the applicable minimum-wage rule.
- July includes **3.5 hours of paid holiday** at base rate as a manual earnings adjustment.
- A shift is allocated to a payroll period using its start date.

## Safety language

The app describes forecasts and impacts. It must not guarantee childcare eligibility, a payslip value or tax treatment.
