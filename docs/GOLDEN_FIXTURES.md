# Hand-authored gross-pay fixtures

These expected values were derived from the documented rules before being encoded as exact-pence assertions. They are an independent arithmetic oracle for implementation changes, not evidence that the employer uses the same rules. A verified payslip takes precedence.

Base rate is 1,790p/hour. Enhanced rates are 2,327p/hour at 1.3×, 2,864p/hour at 1.6× and 3,580p/hour at 2×. Each continuous segment rounds to the nearest penny before summing.

| # | Case | Hand working | Expected |
|---:|---|---|---:|
| 1 | Weekday 07:00–15:00, 60m break | 7h × 1,790p | £125.30 |
| 2 | Saturday 07:00–15:00, 60m | 7h × 2,327p | £162.89 |
| 3 | Sunday 12:00–20:00, 60m | 7h × 2,864p | £200.48 |
| 4 | Fri 19:00–Sat 07:00, 30m | 1h × 1,790p + 3.5h × 2,327p (8,144.5p→8,145p) + 7h × 2,327p | £262.24 |
| 5 | Sun 23:00–Mon 07:00, 60m | break removes the 1h Sunday segment; 7h × 2,327p | £162.89 |
| 6 | Spring DST Sat 19:00–Sun 07:00, 60m | 5h × 2,327p + 5h × 2,864p; clock skips 1h | £259.55 |
| 7 | Autumn DST Sat 19:00–Sun 07:00, 60m | 5h × 2,327p + 7h × 2,864p; clock repeats 1h | £316.83 |
| 8 | Public holiday 07:00–15:00, 60m | 7h × 3,580p | £250.60 |
| 9 | Weekday 07:00–13:00, 60m | 5h × 1,790p | £89.50 |
| 10 | Weekday 19:00–07:00, 60m | 1h × 1,790p + 10h × 2,327p | £250.60 |
| 11 | Sat 19:00–Sun 07:00, 60m | 5h × 2,327p + 6h × 2,864p | £288.19 |
| 12 | Weekday 07:00–07:30, no break | 0.5h × 1,790p | £8.95 |
| 13 | One night minute | 1 × 1,790p × 1.3 ÷ 60 = 38.78p→39p | £0.39 |
| 14 | Rate change at midnight, 20:00–02:00 | 4h × 2,327p + 2h × (1,800p × 1.3) | £139.88 |
| 15 | Sunday also configured public holiday, 07:00–08:00 | highest rule: 1h × 3,580p | £35.80 |

The suite also checks that segment pence sum exactly to shift pence, holiday accrues from paid rather than elapsed time, break precedence is explicit, and both UK clock changes use elapsed time.
