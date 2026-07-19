# Variable Income Planner

Phase 1 is a mobile web app answering one question: **“What happens financially if I work this shift?”**

The repository contains anonymised demonstration state only. Real pilot profiles, rotas and calendar data must never be committed.

This repository replaces the calculation assumptions embedded in the earlier visual prototypes with a documented, tested domain engine.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run check
```

## Current scope

- UK-local shift entry, including overnight shifts and daylight-saving changes
- configurable weekday night, Saturday, Sunday and public-holiday enhancements
- transparent pay segmentation and unpaid-break allocation
- holiday accrual and gross-pay planning; net pay waits for a recent payslip
- childcare assessment-period progress
- monetary and base-rate-equivalent hours buffer, including the exact effect of editing a shift
- payroll cutoff and previous-working-day payday forecasting
- read-only Apple/iCloud/iRota `.ics` calendar checks with review-before-apply and file fallback
- calendar imports that preserve source times and flag template deviations for review
- local-first profiles with passphrase-encrypted export/import recovery; no pilot cloud sync

Read [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) before relying on forecasts. The evidence worksheet is in [docs/PILOT_EVIDENCE.md](docs/PILOT_EVIDENCE.md), and the proposal to challenge is [docs/NEXT_PHASE_PROPOSAL.md](docs/NEXT_PHASE_PROPOSAL.md).

The pilot deliberately has no cloud state. Calendar bearer links stay only in the active browser profile and are excluded from encrypted backups.
