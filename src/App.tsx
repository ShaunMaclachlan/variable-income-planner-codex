import { useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { Dashboard } from './components/Dashboard'
import { ProfileSetup } from './components/ProfileSetup'
import { ShiftForm } from './components/ShiftForm'
import { calendarSnapshotCheckedAt, calendarSnapshotThrough } from './data/calendarSnapshot'
import { calculateShift } from './domain/calculateShift'
import { forecastPayDate, formatPayrollMonth } from './domain/payroll'
import { assessmentSummary } from './domain/summaries'
import type { Shift } from './domain/types'
import { usePersistedState } from './hooks/usePersistedState'
import './styles.css'
import './refinements.css'

type View = 'home' | 'planner' | 'shifts' | 'finances' | 'settings'

const money = (value: number) => new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
}).format(value)

export default function App() {
  const { state, profiles, setState, selectProfile, createProfile, signOut, reset } = usePersistedState()
  const [view, setView] = useState<View>('home')
  const [editing, setEditing] = useState<Shift | undefined>()
  const workingState = state ?? profiles[0]
  const rules = workingState.payRules

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
    setState((current) => ({
      ...current,
      shifts: current.shifts.filter((shift) => shift.id !== id),
    }))
  }

  const sortedShifts = useMemo(
    () => [...workingState.shifts].sort((a, b) => b.date.localeCompare(a.date)),
    [workingState.shifts],
  )
  const assessment = assessmentSummary(workingState.shifts, rules, workingState.settings)
  const payroll = useMemo(() => {
    const groups = new Map<string, number>()
    workingState.shifts.filter((shift) => shift.status !== 'cancelled').forEach((shift) => {
      const date = forecastPayDate(shift, rules)
      groups.set(date, (groups.get(date) ?? 0) + calculateShift(shift, rules).gross)
    })
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [workingState.shifts, rules])

  if (!state) {
    return <ProfileSetup profiles={profiles} onSelect={selectProfile} onCreate={createProfile} />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" onClick={() => setView('home')} aria-label="VIP home">
          <span>VIP</span>
          <div><strong>Variable Income Planner</strong><small>Know what changes</small></div>
        </button>
        <button className="icon-button" onClick={() => setView('settings')} aria-label="Settings">⚙</button>
      </header>

      <main>
        {view === 'home' && <Dashboard state={state} rules={rules} onPlan={() => setView('planner')} />}

        {view === 'planner' && <>
          <div className="page-title">
            <span className="eyebrow">Decision tool</span>
            <h1>Plan a shift</h1>
            <p>Enter a proposed shift to see its impact before accepting it.</p>
          </div>
          <ShiftForm
            key={editing?.id ?? 'new'}
            rules={rules}
            allShifts={state.shifts}
            settings={state.settings}
            existing={editing}
            onSave={saveShift}
            onCancel={editing ? () => { setEditing(undefined); setView('shifts') } : undefined}
          />
        </>}

        {view === 'shifts' && <>
          <div className="page-title">
            <span className="eyebrow">History</span>
            <h1>Your shifts</h1>
            <p>Worked and proposed shifts saved on this device.</p>
          </div>
          {state.profile.id === 'loren' && <p className="snapshot-note">
            Calendar checked {DateTime.fromISO(calendarSnapshotCheckedAt).toFormat('d LLL yyyy')};
            work entries copied through {DateTime.fromISO(calendarSnapshotThrough).toFormat('d LLL yyyy')}.
            This is a snapshot, not live sync.
          </p>}
          <button className="primary-button standalone" onClick={() => { setEditing(undefined); setView('planner') }}>Add a shift</button>
          <section className="card shift-list">
            {sortedShifts.length === 0
              ? <p className="empty">No shifts recorded.</p>
              : sortedShifts.map((shift) => {
                const result = calculateShift(shift, rules)
                return (
                  <article className="shift-row" key={shift.id}>
                    <div className="date-tile"><strong>{DateTime.fromISO(shift.date).day}</strong><span>{DateTime.fromISO(shift.date).toFormat('LLL')}</span></div>
                    <div className="shift-copy">
                      <strong>{shift.label}</strong>
                      <span>{shift.start}–{shift.end} · {result.paidHours.toFixed(1)} paid hours</span>
                      <small>{formatPayrollMonth(forecastPayDate(shift, rules))} payroll · {shift.status}</small>
                      {shift.source === 'calendar' && <em title={shift.sourceTitle}>Calendar wording used</em>}
                      {shift.source === 'email' && <em title={shift.sourceTitle}>Email update applied</em>}
                    </div>
                    <div className="shift-actions">
                      <strong>{shift.status === 'cancelled' ? 'Excluded' : money(result.gross)}</strong>
                      <div><button aria-label={`Edit ${shift.label} on ${DateTime.fromISO(shift.date).toFormat('d LLLL yyyy')}`} onClick={() => { setEditing(shift); setView('planner') }}>Edit</button><button aria-label={`Delete ${shift.label} on ${DateTime.fromISO(shift.date).toFormat('d LLLL yyyy')}`} className="danger" onClick={() => removeShift(shift.id)}>Delete</button></div>
                    </div>
                  </article>
                )
              })}
          </section>
        </>}

        {view === 'finances' && <>
          <div className="page-title">
            <span className="eyebrow">Forecast</span>
            <h1>Finances</h1>
            <p>Assessment earnings and expected payroll timing.</p>
          </div>
          <section className="card">
            <div className="section-heading"><div><span className="eyebrow">Childcare period</span><h2>Assessment position</h2></div></div>
            <div className="metric-pair">
              <div><strong>{money(assessment.gross)}</strong><span>Planning earnings</span></div>
              <div><strong className={assessment.difference >= 0 ? 'positive' : 'negative'}>{assessment.difference >= 0 ? '+' : '−'}{money(Math.abs(assessment.difference))}</strong><span>{assessment.difference >= 0 ? 'Buffer' : 'Remaining'}</span></div>
            </div>
            <p className="fine-print">Includes {state.settings.manualHolidayHours.toFixed(2)} hours ({money(assessment.manualHolidayGross)}) of manually entered paid holiday.</p>
          </section>
          <section className="card">
            <div className="section-heading"><div><span className="eyebrow">Cash timing</span><h2>Expected payrolls</h2></div></div>
            {payroll.length === 0
              ? <p className="empty">No payroll forecast yet.</p>
              : payroll.map(([date, gross]) => (
                <div className="finance-row" key={date}>
                  <div><strong>{formatPayrollMonth(date)}</strong><span>Forecast pay date {DateTime.fromISO(date).toFormat('d LLL')}</span></div>
                  <div><strong>{money(gross)}</strong><span>Gross forecast</span></div>
                </div>
              ))}
            <p className="safety-note">Net pay is intentionally omitted until a recent payslip can calibrate PAYE, National Insurance, pension and deductions.</p>
          </section>
        </>}

        {view === 'settings' && <>
          <div className="page-title">
            <span className="eyebrow">Configuration</span>
            <h1>Settings & assumptions</h1>
            <p>Values that control the planning forecast.</p>
          </div>
          <section className="card">
            <div className="section-heading"><div><span className="eyebrow">Assessment</span><h2>Childcare planning</h2></div></div>
            <div className="form-grid">
              <label>Starts<input type="date" value={state.settings.assessmentStart} onChange={(event) => setState({ ...state, settings: { ...state.settings, assessmentStart: event.target.value } })} /></label>
              <label>Ends<input type="date" value={state.settings.assessmentEnd} onChange={(event) => setState({ ...state, settings: { ...state.settings, assessmentEnd: event.target.value } })} /></label>
              <label>Target earnings<input type="number" step="0.01" value={state.settings.assessmentTarget} onChange={(event) => setState({ ...state, settings: { ...state.settings, assessmentTarget: Number(event.target.value) } })} /></label>
              <label>Paid-holiday hours<input type="number" min="0" step="0.25" value={state.settings.manualHolidayHours} onChange={(event) => setState({ ...state, settings: { ...state.settings, manualHolidayHours: Number(event.target.value) } })} /></label>
            </div>
          </section>
          <section className="card">
            <div className="section-heading"><div><span className="eyebrow">Profile</span><h2>Your details</h2></div></div>
            <div className="form-grid">
              <label>First name<input value={state.profile.firstName} onChange={(event) => setState({ ...state, profile: { ...state.profile, firstName: event.target.value } })} /></label>
              <label>Employer<input value={state.profile.employer} onChange={(event) => setState({ ...state, profile: { ...state.profile, employer: event.target.value } })} /></label>
            </div>
            <button className="secondary-button" onClick={() => { setEditing(undefined); setView('home'); signOut() }}>Switch profile</button>
          </section>
          <section className="card">
            <div className="section-heading"><div><span className="eyebrow">Pay rules</span><h2>Current contract rules</h2></div></div>
            <div className="form-grid rule-inputs">
              <label>Base hourly rate (£)<input type="number" min="0" step="0.01" value={rules.baseRate} onChange={(event) => setState({ ...state, payRules: { ...rules, baseRate: Number(event.target.value) } })} /></label>
              <label>Weekday night rate<input type="number" min="1" step="0.1" value={rules.weekdayNightMultiplier} onChange={(event) => setState({ ...state, payRules: { ...rules, weekdayNightMultiplier: Number(event.target.value) } })} /></label>
              <label>Saturday rate<input type="number" min="1" step="0.1" value={rules.saturdayMultiplier} onChange={(event) => setState({ ...state, payRules: { ...rules, saturdayMultiplier: Number(event.target.value) } })} /></label>
              <label>Sunday rate<input type="number" min="1" step="0.1" value={rules.sundayMultiplier} onChange={(event) => setState({ ...state, payRules: { ...rules, sundayMultiplier: Number(event.target.value) } })} /></label>
              <label>Public holiday rate<input type="number" min="1" step="0.1" value={rules.publicHolidayMultiplier} onChange={(event) => setState({ ...state, payRules: { ...rules, publicHolidayMultiplier: Number(event.target.value) } })} /></label>
            </div>
            <div className="assumption-list">
              <div><span>Weekday nights</span><strong>{rules.weekdayNightMultiplier}× · {rules.nightStarts}–{rules.nightEnds}</strong></div>
              <div><span>Saturday</span><strong>{rules.saturdayMultiplier}×</strong></div>
              <div><span>Sunday</span><strong>{rules.sundayMultiplier}×</strong></div>
              <div><span>Public holiday worked</span><strong>{rules.publicHolidayMultiplier}×</strong></div>
              <div><span>Holiday accrual</span><strong>1h per 8.2 paid hours</strong></div>
              <div><span>Cross-band break</span><strong>Highest-rate hours first</strong></div>
            </div>
            <p className="safety-note">The highest applicable enhancement wins. No overtime premium is assumed because the contract does not define one.</p>
          </section>
          <button className="secondary-button standalone" onClick={() => { if (window.confirm(state.profile.id === 'loren' ? 'Reset Loren’s locally saved changes to the confirmed seed and calendar snapshot?' : 'Remove all shifts from this profile?')) reset() }}>Reset this profile</button>
        </>}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {([['home', '⌂', 'Home'], ['planner', '+', 'Plan'], ['shifts', '▣', 'Shifts'], ['finances', '£', 'Finances']] as const).map(([target, icon, label]) => (
          <button aria-label={label} className={view === target ? 'active' : ''} key={target} onClick={() => { setEditing(undefined); setView(target) }}><span>{icon}</span>{label}</button>
        ))}
      </nav>
    </div>
  )
}
