import { useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { Dashboard } from './components/Dashboard'
import { ShiftForm } from './components/ShiftForm'
import { defaultPayRules } from './domain/rules'
import { calculateShift } from './domain/calculateShift'
import { forecastPayDate, formatPayrollMonth } from './domain/payroll'
import { assessmentSummary, totalFor } from './domain/summaries'
import type { Shift } from './domain/types'
import { usePersistedState } from './hooks/usePersistedState'
import './styles.css'

type View = 'home' | 'planner' | 'shifts' | 'finances' | 'settings'
const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)

export default function App() {
  const { state, setState, reset } = usePersistedState()
  const [view, setView] = useState<View>('home')
  const [editing, setEditing] = useState<Shift | undefined>()
  const rules = defaultPayRules
  const currentMonth = DateTime.now().setZone(rules.zone).toFormat('yyyy-MM')
  const currentMonthGross = totalFor(state.shifts.filter((shift) => shift.date.startsWith(currentMonth)), rules).gross

  const saveShift = (shift: Shift) => {
    setState((current) => ({
      ...current,
      shifts: current.shifts.some((item) => item.id === shift.id)
        ? current.shifts.map((item) => item.id === shift.id ? shift : item)
        : [shift, ...current.shifts],
    }))
    setEditing(undefined)
    setView('shifts')
  }

  const removeShift = (id: string) => {
    if (!window.confirm('Delete this shift?')) return
    setState((current) => ({ ...current, shifts: current.shifts.filter((shift) => shift.id !== id) }))
  }
  const sortedShifts = useMemo(() => [...state.shifts].sort((a, b) => b.date.localeCompare(a.date)), [state.shifts])
  const assessment = assessmentSummary(state.shifts, rules, state.settings)
  const payroll = useMemo(() => {
    const groups = new Map<string, number>()
    state.shifts.filter((shift) => shift.status !== 'cancelled').forEach((shift) => {
      const date = forecastPayDate(shift, rules)
      groups.set(date, (groups.get(date) ?? 0) + calculateShift(shift, rules).gross)
    })
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [state.shifts, rules])

  return <div className="app-shell">
    <header className="app-header"><button className="brand" onClick={() => setView('home')} aria-label="VIP home"><span>VIP</span><div><strong>Variable Income Planner</strong><small>Know what changes</small></div></button><button className="icon-button" onClick={() => setView('settings')} aria-label="Settings">⚙</button></header>
    <main>
      {view === 'home' && <Dashboard state={state} rules={rules} onPlan={() => setView('planner')} />}
      {view === 'planner' && <><div className="page-title"><span className="eyebrow">Decision tool</span><h1>Plan a shift</h1><p>Enter a proposed shift to see its impact before accepting it.</p></div><ShiftForm key={editing?.id ?? 'new'} rules={rules} existing={editing} currentMonthGross={currentMonthGross} retention={state.settings.takeHomeRetention} onSave={saveShift} onCancel={editing ? () => { setEditing(undefined); setView('shifts') } : undefined} /></>}
      {view === 'shifts' && <><div className="page-title"><span className="eyebrow">History</span><h1>Your shifts</h1><p>Worked and proposed shifts saved on this device.</p></div><button className="primary-button standalone" onClick={() => { setEditing(undefined); setView('planner') }}>Add a shift</button><section className="card shift-list">{sortedShifts.length === 0 ? <p className="empty">No shifts recorded.</p> : sortedShifts.map((shift) => { const result = calculateShift(shift, rules); return <article className="shift-row" key={shift.id}><div className="date-tile"><strong>{DateTime.fromISO(shift.date).day}</strong><span>{DateTime.fromISO(shift.date).toFormat('LLL')}</span></div><div className="shift-copy"><strong>{shift.label}</strong><span>{shift.start}–{shift.end} · {result.paidHours.toFixed(1)} paid hours</span><small>{formatPayrollMonth(forecastPayDate(shift, rules))} payroll · {shift.status}</small></div><div className="shift-actions"><strong>{shift.status === 'cancelled' ? 'Excluded' : money(result.gross)}</strong><div><button onClick={() => { setEditing(shift); setView('planner') }}>Edit</button><button className="danger" onClick={() => removeShift(shift.id)}>Delete</button></div></div></article>})}</section></>}
      {view === 'finances' && <><div className="page-title"><span className="eyebrow">Forecast</span><h1>Finances</h1><p>Assessment earnings and expected payroll timing.</p></div><section className="card"><div className="section-heading"><div><span className="eyebrow">Childcare period</span><h2>Assessment position</h2></div></div><div className="metric-pair"><div><strong>{money(assessment.gross)}</strong><span>Planning earnings</span></div><div><strong className={assessment.difference >= 0 ? 'positive' : 'negative'}>{assessment.difference >= 0 ? '+' : '−'}{money(Math.abs(assessment.difference))}</strong><span>{assessment.difference >= 0 ? 'Buffer' : 'Remaining'}</span></div></div><p className="fine-print">Includes {money(state.settings.manualAssessmentEarnings)} of manually entered paid-holiday earnings.</p></section><section className="card"><div className="section-heading"><div><span className="eyebrow">Cash timing</span><h2>Expected payrolls</h2></div></div>{payroll.map(([date, gross]) => <div className="finance-row" key={date}><div><strong>{formatPayrollMonth(date)}</strong><span>Forecast pay date {DateTime.fromISO(date).toFormat('d LLL')}</span></div><div><strong>{money(gross)}</strong><span>{money(gross * state.settings.takeHomeRetention)} indicative net</span></div></div>)}</section></>}
      {view === 'settings' && <><div className="page-title"><span className="eyebrow">Configuration</span><h1>Settings & assumptions</h1><p>Values that control the planning forecast.</p></div><section className="card"><div className="section-heading"><div><span className="eyebrow">Assessment</span><h2>Childcare planning</h2></div></div><div className="form-grid"><label>Starts<input type="date" value={state.settings.assessmentStart} onChange={(event) => setState({ ...state, settings: { ...state.settings, assessmentStart: event.target.value } })} /></label><label>Ends<input type="date" value={state.settings.assessmentEnd} onChange={(event) => setState({ ...state, settings: { ...state.settings, assessmentEnd: event.target.value } })} /></label><label>Target earnings<input type="number" step="0.01" value={state.settings.assessmentTarget} onChange={(event) => setState({ ...state, settings: { ...state.settings, assessmentTarget: Number(event.target.value) } })} /></label><label>Manual earnings<input type="number" step="0.01" value={state.settings.manualAssessmentEarnings} onChange={(event) => setState({ ...state, settings: { ...state.settings, manualAssessmentEarnings: Number(event.target.value) } })} /></label><label className="wide">Indicative take-home percentage<input type="number" min="0" max="100" step="1" value={state.settings.takeHomeRetention * 100} onChange={(event) => setState({ ...state, settings: { ...state.settings, takeHomeRetention: Number(event.target.value) / 100 } })} /></label></div></section><section className="card"><div className="section-heading"><div><span className="eyebrow">Pay rules</span><h2>Current assumptions</h2></div></div><div className="assumption-list"><div><span>Base rate</span><strong>{money(rules.baseRate)}/hour</strong></div><div><span>Weekday nights</span><strong>{rules.weekdayNightMultiplier}× · {rules.nightStarts}–{rules.nightEnds}</strong></div><div><span>Saturday</span><strong>{rules.saturdayMultiplier}×</strong></div><div><span>Sunday</span><strong>{rules.sundayMultiplier}×</strong></div><div><span>Public holiday</span><strong>{rules.publicHolidayMultiplier}× provisional</strong></div><div><span>Holiday accrual</span><strong>1h per 8.2h</strong></div></div><p className="safety-note">Weekend/night precedence, public-holiday treatment, overtime stacking and break allocation still require payslip confirmation.</p></section><button className="secondary-button standalone" onClick={() => { if (window.confirm('Reset all locally saved changes to the verified seed data?')) reset() }}>Reset local data</button></>}
    </main>
    <nav className="bottom-nav" aria-label="Primary navigation">{([['home', '⌂', 'Home'], ['planner', '+', 'Plan'], ['shifts', '▣', 'Shifts'], ['finances', '£', 'Finances']] as const).map(([target, icon, label]) => <button className={view === target ? 'active' : ''} key={target} onClick={() => { setEditing(undefined); setView(target) }}><span>{icon}</span>{label}</button>)}</nav>
  </div>
}
