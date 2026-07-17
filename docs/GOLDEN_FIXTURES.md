# Golden shift fixtures

These expected values were calculated independently of the implementation and are encoded in tests. Base rate is £17.90.

| Case | Shift | Break | Expected paid hours | Expected gross |
|---|---|---:|---:|---:|
| Weekday early | Tue 7 Jul 07:00–15:00 | 60m | 7.00 | £125.30 |
| Saturday early | Sat 27 Jun 07:00–15:00 | 60m | 7.00 | £162.89 |
| Sunday late | Sun 28 Jun 13:00–20:00 | 60m | 6.00 | £171.84 |
| Friday into Saturday | Fri 10 Jul 19:00–Sat 07:00 | 30m | 11.50 | £264.92 |
| Sunday into Monday | Sun 12 Jul 23:00–Mon 07:00 | 60m | 7.00 | £168.26 |
| Spring clock change | Sat 28 Mar 19:00–Sun 07:00 | 60m | 10.00 | £264.92 |
| Autumn clock change | Sat 24 Oct 19:00–Sun 07:00 | 60m | 12.00 | £322.20 |
| Weekday overtime | Tue 7 Jul 07:00–15:00, 1.5× OT | 60m | 7.00 | £187.95 |
| Provisional public holiday | Mon 31 Aug 07:00–15:00 | 60m | 7.00 | £200.48 |

Any verified payslip that disagrees with a fixture takes precedence. Update the assumption, expected value and implementation together.
