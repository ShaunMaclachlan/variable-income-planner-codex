import { DateTime } from 'luxon'
import { assessmentSummary, totalFor } from '../domain/summaries'
import type { PayRules, PlannerState } from '../domain/types'

interface Props { state: PlannerState; rules: PayRules; onPlan: () => void; onCalendar: () => void }
const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)

export function Dashboard({ state, rules, onPlan, onCalendar }: Props) {
  const assessment = assessmentSummary(state.shifts, rules, state.settings)
  const today = DateTime.now().setZone(rules.zone)
  const monthShifts = state.shifts.filter((shift) => shift.date.startsWith(today.toFormat('yyyy-MM')))
  const month = totalFor(monthShifts, rules)
  const upcoming = state.shifts.filter((shift) => shift.status !== 'cancelled' && shift.date >= today.toISODate()!).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  const differenceLabel = assessment.difference >= 0 ? `${money(assessment.difference)} buffer` : `${money(Math.abs(assessment.difference))} remaining`
  const hoursLabel = `${Math.abs(assessment.bufferHours).toFixed(1)} base-rate hours`
  const exampleHours = Math.max(0, assessment.bufferHours - 2)

  return <>
    <section className="welcome"><span>{today.toFormat('cccc d LLLL')}{state.profile.employer ? ` · ${state.profile.employer}` : ''}</span><h1>Good {today.hour < 12 ? 'morning' : today.hour < 18 ? 'afternoon' : 'evening'}, {state.profile.firstName}</h1></section>
    <section className="card hero-card">
      <span className="eyebrow">What needs your attention</span>
      <h2>{assessment.difference >= 0 ? 'Your recorded earnings are above the planning target' : 'Your assessment target still needs attention'}</h2>
      <p>{differenceLabel} · {hoursLabel}. Add or edit a shift to see exactly what changes.</p>
      <button className="hero-button" onClick={onPlan}>Plan a shift</button>
    </section>
    <section className={`card buffer-card ${assessment.difference >= 0 ? 'safe' : 'short'}`}>
      <div className="section-heading"><div><span className="eyebrow">Room to change</span><h2>{assessment.difference >= 0 ? 'Your earnings cushion' : 'Hours still needed'}</h2></div></div>
      <div className="buffer-number"><strong>{Math.abs(assessment.bufferHours).toFixed(2)}h</strong><span>at the base rate of {money(rules.baseRate)}/hour</span></div>
      {assessment.difference >= 0
        ? <p>A weekday early shift changing from 3pm to 1pm uses 2 paid hours and would leave about <strong>{exampleHours.toFixed(2)} hours</strong> of cushion. Edit the actual shift for its exact enhanced-rate result.</p>
        : <p>This is the base-rate equivalent. An enhanced shift may cover the gap in fewer paid hours.</p>}
    </section>
    <section className="card calendar-home-card">
      <div className="section-heading"><div><span className="eyebrow">Calendar</span><h2>{state.calendarConnection ? 'Check for rota changes' : 'Connect your work calendar'}</h2></div>{state.calendarConnection && <span className="status good">Connected</span>}</div>
      <p>{state.calendarConnection ? 'VIP will check for new or changed shifts and show them before updating your forecast.' : 'Use a read-only Apple, iCloud or subscribed rota calendar link.'}</p>
      <button className="secondary-button calendar-home-button" onClick={onCalendar}>{state.calendarConnection ? 'Sync calendar' : 'Connect calendar'}</button>
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
