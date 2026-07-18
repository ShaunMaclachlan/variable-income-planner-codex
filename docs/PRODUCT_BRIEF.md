# Phase 1 product brief

## User and job

The first configured user is Loren, a Phyllis Tuckwell bank worker. The MVP helps a variable-income worker understand the gross financial effect and payroll timing of a proposed shift before accepting it.

Within five seconds the home screen should show:

1. Where she stands in the current childcare assessment period.
2. What needs attention.
3. What changes if she adds another shift.

## Included

- add, edit and remove shifts
- selectable 1pm, 2pm and 3pm early finishes
- early, late, long-day, night and training templates
- read-only Apple/iCloud/subscribed-calendar link checks and `.ics` file import
- review-before-apply calendar changes, deduplication and protected manual/email overrides
- segment pay at UK local-time and day boundaries
- gross pay, payroll timing and holiday accrual
- assessment-period progress and buffer/shortfall
- buffer shown in money and base-rate-equivalent hours
- exact post-change buffer when adding or editing a shift
- on-device profile chooser and personalised home screen
- neutral pay-rule defaults for new profiles, with contract rates entered in Settings
- local persistence and reset to confirmed seed plus calendar snapshot
- calculation breakdowns and explicit decisions

## Excluded from this vertical slice

- background calendar syncing without a user press
- payslip ingestion and net-pay calculation
- secure authentication and cloud sync (device profiles are not online accounts)
- automated eligibility decisions or advice to accept or decline a shift
