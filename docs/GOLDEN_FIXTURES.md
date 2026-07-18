# Golden shift fixtures

These expected values are encoded in tests. Base rate is £17.90. Cross-band breaks reduce the highest-rate hours first.

| Case | Shift | Break | Expected paid hours | Expected gross |
|---|---|---:|---:|---:|
| Weekday early | Tue 7 Jul 07:00–15:00 | 60m | 7.00 | £125.30 |
| Saturday early | Sat 27 Jun 07:00–15:00 | 60m | 7.00 | £162.89 |
| Sunday late | Sun 28 Jun 12:00–20:00 | 60m | 7.00 | £200.48 |
| Friday into Saturday | Fri 10 Jul 19:00–Sat 07:00 | 30m | 11.50 | £262.24 |
| Sunday into Monday | Sun 12 Jul 23:00–Mon 07:00 | 60m | 7.00 | £162.89 |
| Spring clock change | Sat 28 Mar 19:00–Sun 07:00 | 60m | 10.00 | £259.55 |
| Autumn clock change | Sat 24 Oct 19:00–Sun 07:00 | 60m | 12.00 | £316.83 |
| Public holiday worked | Mon 31 Aug 07:00–15:00 | 60m | 7.00 | £250.60 |

Any verified payslip that disagrees with a fixture takes precedence. Update the decision, expected value and implementation together.
