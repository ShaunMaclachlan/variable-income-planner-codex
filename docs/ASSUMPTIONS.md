# Calculation decisions

The domain engine is the source of truth. These are demonstration rules and hypotheses until independently reconciled against a real contract and payslip. No real pilot rota is stored in this repository.

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
- When a break crosses pay bands, it is deducted from the **highest-rate hours first**. This remains an assumption pending payslip verification.
- Early shifts start at 07:00 and can finish at **13:00, 14:00 or 15:00**.
- The demonstration late template is **12:00–20:00**.
- Long days are 07:00–20:00 and nights are 19:00–07:30.
- For a training/study entry longer than six hours, the planner assumes a 20-minute unpaid break unless a different break is entered. GOV.UK says adult workers are usually entitled to a 20-minute break when working more than six hours, but whether it is paid depends on the contract and healthcare work can involve compensatory-rest rules: <https://www.gov.uk/rest-breaks-work>.

## Calendar wording policy

- The event title determines the shift type; conflicting calendar clock times do not change that type.
- An early event keeps its calendar finish only when that finish is 13:00, 14:00 or 15:00. Otherwise it defaults to 15:00.
- A confirmed email change overrides an older calendar finish after user review.
- Late, long-day and night titles use the standard templates above.
- Work training keeps its recorded start and finish and uses the length-based break rule.
- Unrelated events such as sports training are excluded.
- No real calendar snapshot or future rota is committed.
- Until an email integration is designed, later changes are applied through Edit Shift and saved locally.
- Calendar sync is user-triggered and read-only. VIP never writes to the source calendar.
- A subscription-link sync reads timed `.ics` events, filters to the active assessment period and applies nothing until the user reviews the result.
- Existing email, manual and confirmed entries take priority over a conflicting calendar entry.
- Calendar event identity and date/shift matching prevent repeat imports. Events that disappear from a feed are not automatically deleted from VIP.
- An `.ics` file can be selected when the calendar host does not allow a browser to fetch its subscription link.
- Recurring `.ics` rules are currently flagged and only their first event is considered; iRota shift entries are expected to be individual events until a real feed confirms otherwise.
- Public iCloud calendar links are bearer links: anyone who obtains the link can view that calendar. Only a separate work calendar should be connected, and the link is stored only in the browser profile.

## Childcare and payroll

- Assessment-period dates and the planning target are entered per profile.
- Childcare progress uses expected earnings for shifts whose start date falls inside the assessment period, not the later cash pay date.
- The hours cushion is the monetary buffer divided by the profile's base hourly rate. It is labelled **base-rate hours** because enhanced Saturday, Sunday, night or public-holiday hours consume a different amount of monetary buffer.
- Editing a shift uses the actual segmented pay calculation to show the exact resulting monetary and base-rate-hours position.
- Paid-holiday hours are entered manually until payroll evidence supports an automated rule.
- Payroll cutoff is the last Saturday of the month, inclusive.
- A shift crossing the cutoff is allocated using its start date.
- Payday is the 25th, moved to the previous working day for a weekend or listed England and Wales public holiday.
- All time boundaries use `Europe/London`; daylight-saving transitions use actual elapsed time.

## Deliberately omitted

- Net pay is not estimated until a recent payslip is available to calibrate PAYE, National Insurance, pension and other deductions.
- The app forecasts; it does not guarantee childcare eligibility, a payslip value or tax treatment.
