# Variable Income Planner

Phase 1 is a mobile web app, initially configured for Loren, answering one question: **“What happens financially if I work this shift?”**

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
- calendar snapshot normalisation where the shift title wins over conflicting event hours
- on-device profiles and persistence; no secure account or cloud sync yet

Read [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) before relying on forecasts. Product questions that remain after the first build are recorded in [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md).
