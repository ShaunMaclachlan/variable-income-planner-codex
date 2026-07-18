import { DateTime } from 'luxon'
import { assessmentSummary, totalFor } from '../domain/summaries'
import type { PayRules, PlannerState } from '../domain/types'

interface Props { state: PlannerState; rules: PayRules; onPlan: () => void }
const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)

export function Dashboard({ state, rules, onPlan }: Props) {
  const assessment = assessmentSummary(state.shifts, rules, state.settings)
  const today = DateTime.now().setZone(rules.zone)
  const monthShifts = state.shifts.filter((shift) => shift.date.startsWith(today.toFormat('yyyy-MM')))
  const month = totalFor(monthShifts, rules)
  const upcoming = state.shifts.filter((shift) => shift.status !== 'cancelled' && shift.date >= today.toISODate()!).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  const differenceLabel = assessment.difference >= 0 ? `${money(assessment.difference)} buffer` : `${money(Math.abs(assessment.difference))} remaining`

  return <>
    <section className="welcome"><span>{today.toFormat('cccc d LLLL')}</span><h1>Good {today.hour < 12 ? 'morning' : today.hour < 18 ? 'afternoon' : 'evening'}, Loren</h1></section>
    <section className="card hero-card">
      <span className="eyebrow">What needs your attention</span>
      <h2>{assessment.difference >= 0 ? 'Your recorded earnings are above the planning target' : 'Your assessment target still needs attention'}</h2>
      <p>{differenceLabel}. Add a proposed shift to see exactly what changes.</p>
      <button className="hero-button" onClick={onPlan}>Plan a shift</button>
    </section>
    <section className="card">
      <div className="section-heading"><div><span className="eyebrow">Childcare</span><h2>Assessment progress</h2></div><span className={assessment.difference >= 0 ? 'status good' : 'status warning'}>{assessment.difference >= 0 ? 'Above target' : 'In progress'}</span></div>
      <div className="metric-pair"><div><strong>{money(assessment.gross)}</strong><span>Recorded + manual earnings</span></div><div><strong>{money(assessment.target)}</strong><span>Planning target</span></div></div>
      <div className="progress"><div style={{ width: `${assessment.progress * 100}%` }} /></div>
      <p className="fine-print">Period {DateTime.fromISO(state.settings.assessmentStart).toFormat('d LLL')}–{DateTime.fromISO(state.settings.assessmentEnd).toFormat('d LLL yyyy')}. This is a planning indicator, not an eligibility decision.</p>
    </section>
    <section className="card">
      <div className="section-heading"><div><span className="eyebrow">This month</span><h2>Financial position</h2></div></div>
      <div className="snapshot-grid"><div><span>Gross forecast</span><strong>{money(month.gross)}</strong></div><div><span>Included shifts</span><strong>{monthShifts.filter((shift) => shift.status !== 'cancelled').length}</strong></div><div><span>Paid hours</span><strong>{month.hours.toFixed(1)}h</strong></div><div><span>Holiday earned</span><strong>{month.holidayHours.toFixed(1)}h</strong></div></div>
      <p className="fine-print">Includes worked and planned shifts. Net pay is waiting for a recent payslip.</p>
    </section>
    <section className="card">
      <div className="section-heading"><div><span className="eyebrow">Next</span><h2>Upcoming shifts</h2></div></div>
      {upcoming.length === 0 ? <p className="empty">No upcoming shifts recorded.</p> : upcoming.map((shift) => <div className="list-row" key={shift.id}><div className="date-tile"><strong>{DateTime.fromISO(shift.date).day}</strong><span>{DateTime.fromISO(shift.date).toFormat('LLL')}</span></div><div><strong>{shift.label}</strong><span>{shift.start}–{shift.end} · {shift.status}</span></div></div>)}
    </section>
  </>
}
