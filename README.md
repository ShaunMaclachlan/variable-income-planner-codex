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
- calendar normalisation where the shift title wins over conflicting event hours
- local-first profiles; experimental cloud code is not enabled in the public build

Read [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) before relying on forecasts. Product questions that remain after the first build are recorded in [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md).

Experimental Supabase setup notes are in [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md); cloud state is not approved for the pilot.
