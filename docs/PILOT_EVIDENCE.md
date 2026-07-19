# Track A pilot evidence pack

This is the acceptance record for one complete pay period. Real names, emails, rotas and payslip images stay outside the repository in the pilot's private record.

## Before the pilot

- [ ] Repository is private and GitHub Pages is unpublished.
- [ ] Pilot user confirms the exact template hours and unpaid-break treatment.
- [ ] Two payslips confirm cutoff and pay-date rules.
- [ ] The source calendar is confirmed to emit individual timed events rather than unresolved recurrence rules.
- [ ] The independent manual shift log has an owner and storage location.
- [ ] Accepted gross tolerance is recorded. Current proposed threshold: 100 pence.

## Per source change

Record a private row with: received time, source identity, offered/changed/cancelled, expected interpretation, VIP interpretation, uncertain flag, user action, financial effect, detection latency, and whether VIP or the user noticed first.

Zero silent misses means the independent source log and VIP comparison has no unexplained missing, unexpected or changed records. `compareShiftLog` provides the deterministic diff; it does not create the independent evidence.

## Payslip reconciliation

For every line in the pay period record: work date, start/end, unpaid minutes, pay band, paid minutes, rate, expected pence, payslip pence, difference and explanation. Record whether payroll rounds per segment, shift or period and update `docs/ASSUMPTIONS.md` before changing fixtures.

`reconcileGross` compares integer-pence forecast and payslip gross against an explicit tolerance. A passing number without the line-by-line worksheet is not acceptance evidence.

## Go/no-go record

- One complete cutoff-to-cutoff period:
- Number of real source changes:
- Silent misses:
- Ambiguous changes surfaced:
- Gross difference in pence:
- Unprompted opens in following period:
- Pull-model occasions where a push was wanted:
- Is gross pay the real decision variable, or only a proxy?:
- Kill criterion hit?:
- Track B decision and named owner:
