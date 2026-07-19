import { useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { Dashboard } from './components/Dashboard'
import { CalendarSync } from './components/CalendarSync'
import { BackupControls } from './components/BackupControls'
import { ProfileSetup } from './components/ProfileSetup'
import { ShiftForm } from './components/ShiftForm'
import { calculateShift } from './domain/calculateShift'
import { formatPence, hourlyRatePenceForDate, penceToPounds, poundsToPence, withRatePeriod } from './domain/money'
import { forecastPayDate, forecastPayDateForWorkDate, formatPayrollMonth } from './domain/payroll'
import { assessmentSummary } from './domain/summaries'
import type { Shift } from './domain/types'
import { usePersistedState } from './hooks/usePersistedState'
import './styles.css'
import './refinements.css'

type View = 'home' | 'planner' | 'shifts' | 'finances' | 'calendar' | 'settings'

export default function App() {
  const { state, profiles, setState, selectProfile, createProfile, signOut, reset, getBackupStore, restoreBackupStore } = usePersistedState()
  const [view, setView] = useState<View>('home')
  const [editing, setEditing] = useState<Shift | undefined>()
  const [syncRequest, setSyncRequest] = useState(0)
  const [rateEffectiveFrom, setRateEffectiveFrom] = useState(DateTime.now().setZone('Europe/London').toISODate()!)
  const [newRatePounds, setNewRatePounds] = useState('')
  const workingState = state ?? profiles[0]
  const rules = workingState.payRules
  const currentRatePence = hourlyRatePenceForDate(rules, DateTime.now().setZone(rules.zone).toISODate()!)

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
      groups.set(date, (groups.get(date) ?? 0) + calculateShift(shift, rules).grossPence)
    })
    if (workingState.settings.manualHolidayDate && workingState.settings.manualHolidayHours > 0) {
      const date = forecastPayDateForWorkDate(workingState.settings.manualHolidayDate, rules)
      const grossPence = Math.round(
        workingState.settings.manualHolidayHours
        * hourlyRatePenceForDate(rules, workingState.settings.manualHolidayDate),
      )
      groups.set(date, (groups.get(date) ?? 0) + grossPence)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [workingState.settings.manualHolidayDate, workingState.settings.manualHolidayHours, workingState.shifts, rules])

  if (!state) {
    return <ProfileSetup profiles={profiles} onSelect={selectProfile} onCreate={createProfile} />
  }

  const openCalendar = () => {
    setEditing(undefined)
    setView('calendar')
    if (state.calendarConnection) setSyncRequest(Date.now())
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
        {view === 'home' && <Dashboard state={state} rules={rules} onPlan={() => setView('planner')} onCalendar={openCalendar} />}

        {view === 'calendar' && <>
          <div className="page-title">
            <span className="eyebrow">Calendar</span>
            <h1>Sync your shifts</h1>
            <p>Check a read-only Apple, iCloud or rota subscription and review every change before it affects the forecast.</p>
          </div>
          <CalendarSync state={state} setState={setState} syncRequest={syncRequest} />
        </>}

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
                      <strong>{shift.status === 'cancelled' ? 'Excluded' : formatPence(result.grossPence)}</strong>
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
              <div><strong>{formatPence(assessment.grossPence)}</strong><span>Total gross forecast</span></div>
              <div><strong className={assessment.differencePence >= 0 ? 'positive' : 'negative'}>{assessment.differencePence >= 0 ? '+' : '−'}{formatPence(Math.abs(assessment.differencePence))}</strong><span>{assessment.differencePence >= 0 ? 'Forecast buffer' : 'Remaining'}</span></div>
            </div>
            <p className="fine-print">Earned/confirmed {formatPence(assessment.workedGrossPence)} · planned {formatPence(assessment.plannedGrossPence)}. Includes {state.settings.manualHolidayHours.toFixed(2)} hours ({formatPence(assessment.manualHolidayGrossPence)}) of dated paid holiday.</p>
            {state.settings.manualHolidayHours > 0 && !state.settings.manualHolidayDate && <p className="inline-warning">Paid holiday is excluded until its work/payroll date is entered.</p>}
          </section>
          <section className="card">
            <div className="section-heading"><div><span className="eyebrow">Cash timing</span><h2>Expected payrolls</h2></div></div>
            {payroll.length === 0
              ? <p className="empty">No payroll forecast yet.</p>
              : payroll.map(([date, gross]) => (
                <div className="finance-row" key={date}>
                  <div><strong>{formatPayrollMonth(date)}</strong><span>Forecast pay date {DateTime.fromISO(date).toFormat('d LLL')}</span></div>
                  <div><strong>{formatPence(gross)}</strong><span>Gross forecast</span></div>
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
              <label>Target earnings<input type="number" step="0.01" value={penceToPounds(state.settings.assessmentTargetPence)} onChange={(event) => setState({ ...state, settings: { ...state.settings, assessmentTargetPence: poundsToPence(Number(event.target.value)) } })} /></label>
              <label>Paid-holiday hours<input type="number" min="0" step="0.25" value={state.settings.manualHolidayHours} onChange={(event) => setState({ ...state, settings: { ...state.settings, manualHolidayHours: Number(event.target.value) } })} /></label>
              <label>Paid-holiday work date<input type="date" value={state.settings.manualHolidayDate} onChange={(event) => setState({ ...state, settings: { ...state.settings, manualHolidayDate: event.target.value } })} /></label>
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
              <label>Base hourly rate (£)<input type="number" readOnly value={penceToPounds(currentRatePence)} /></label>
              <label>New rate effective from<input type="date" value={rateEffectiveFrom} onChange={(event) => setRateEffectiveFrom(event.target.value)} /></label>
              <label>New base rate (£)<input type="number" min="0" step="0.01" value={newRatePounds} onChange={(event) => setNewRatePounds(event.target.value)} /></label>
              <label>Weekday night rate<input type="number" min="1" step="0.1" value={rules.weekdayNightMultiplier} onChange={(event) => setState({ ...state, payRules: { ...rules, weekdayNightMultiplier: Number(event.target.value) } })} /></label>
              <label>Saturday rate<input type="number" min="1" step="0.1" value={rules.saturdayMultiplier} onChange={(event) => setState({ ...state, payRules: { ...rules, saturdayMultiplier: Number(event.target.value) } })} /></label>
              <label>Sunday rate<input type="number" min="1" step="0.1" value={rules.sundayMultiplier} onChange={(event) => setState({ ...state, payRules: { ...rules, sundayMultiplier: Number(event.target.value) } })} /></label>
              <label>Public holiday rate<input type="number" min="1" step="0.1" value={rules.publicHolidayMultiplier} onChange={(event) => setState({ ...state, payRules: { ...rules, publicHolidayMultiplier: Number(event.target.value) } })} /></label>
              <label>Paid hours per 1h holiday<input type="number" min="0" step="0.1" value={rules.holidayHoursPerPaidHours > 0 ? Number((1 / rules.holidayHoursPerPaidHours).toFixed(2)) : ''} placeholder="Not set" onChange={(event) => { const paidHours = Number(event.target.value); setState({ ...state, payRules: { ...rules, holidayHoursPerPaidHours: paidHours > 0 ? 1 / paidHours : 0 } }) }} /></label>
            </div>
            <button className="secondary-button" disabled={!rateEffectiveFrom || poundsToPence(Number(newRatePounds)) <= 0} onClick={() => {
              const hourlyRatePence = poundsToPence(Number(newRatePounds))
              if (hourlyRatePence <= 0) return
              setState({ ...state, payRules: withRatePeriod(rules, { effectiveFrom: rateEffectiveFrom, hourlyRatePence }) })
              setNewRatePounds('')
            }}>Add effective-dated rate</button>
            <div className="assumption-list">
              {rules.ratePeriods.map((period) => <div key={period.effectiveFrom}><span>Base rate from {DateTime.fromISO(period.effectiveFrom).toFormat('d LLL yyyy')}</span><strong>{formatPence(period.hourlyRatePence)}/hour</strong></div>)}
              <div><span>Weekday nights</span><strong>{rules.weekdayNightMultiplier}× · {rules.nightStarts}–{rules.nightEnds}</strong></div>
              <div><span>Saturday</span><strong>{rules.saturdayMultiplier}×</strong></div>
              <div><span>Sunday</span><strong>{rules.sundayMultiplier}×</strong></div>
              <div><span>Public holiday worked</span><strong>{rules.publicHolidayMultiplier}×</strong></div>
              <div><span>Holiday accrual</span><strong>{rules.holidayHoursPerPaidHours > 0 ? `1h per ${(1 / rules.holidayHoursPerPaidHours).toFixed(1)} paid hours` : 'Not set'}</strong></div>
              <div><span>Cross-band break</span><strong>Highest-rate hours first</strong></div>
            </div>
            <p className="safety-note">The highest applicable enhancement wins. No overtime premium is assumed because the contract does not define one.</p>
          </section>
          <BackupControls getBackupStore={getBackupStore} restoreBackupStore={restoreBackupStore} />
          <button className="secondary-button standalone" onClick={() => { if (window.confirm('Remove all shifts from this profile?')) reset() }}>Reset this profile</button>
        </>}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {([['home', '⌂', 'Home'], ['planner', '+', 'Plan'], ['calendar', '↻', 'Sync'], ['shifts', '▣', 'Shifts'], ['finances', '£', 'Finances']] as const).map(([target, icon, label]) => (
          <button aria-label={label} className={view === target ? 'active' : ''} key={target} onClick={() => target === 'calendar' ? openCalendar() : (setEditing(undefined), setView(target))}><span>{icon}</span>{label}</button>
        ))}
      </nav>
    </div>
  )
}
