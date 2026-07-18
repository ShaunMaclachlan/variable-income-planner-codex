import { useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { templates, type TemplateName } from '../data/defaults'
import { statutoryBreakMinutes } from '../domain/breaks'
import { calculateShift } from '../domain/calculateShift'
import { forecastPayDate, formatPayrollMonth } from '../domain/payroll'
import { shiftChangeSummary } from '../domain/summaries'
import type { PayRules, PlannerSettings, Shift } from '../domain/types'

interface Props {
  rules: PayRules
  allShifts: Shift[]
  settings: PlannerSettings
  existing?: Shift
  onSave: (shift: Shift) => void
  onCancel?: () => void
}

const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)

function initialDraft(existing?: Shift): Shift {
  return existing ?? {
    id: crypto.randomUUID(),
    label: 'Early',
    date: DateTime.now().setZone('Europe/London').toISODate()!,
    start: templates.Early.start,
    end: templates.Early.end,
    breakMinutes: templates.Early.breakMinutes,
    status: 'planned',
    source: 'manual',
  }
}

export function ShiftForm({ rules, allShifts, settings, existing, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(() => initialDraft(existing))
  const rawResult = useMemo(() => calculateShift(draft, rules), [draft, rules])
  const isTrainingOrStudy = /training|study/i.test(draft.label)
  const assumedMinimumBreak = isTrainingOrStudy ? statutoryBreakMinutes(rawResult.elapsedHours) : 0
  const effectiveBreak = Math.max(draft.breakMinutes, assumedMinimumBreak)
  const result = useMemo(
    () => calculateShift({ ...draft, breakMinutes: effectiveBreak }, rules),
    [draft, effectiveBreak, rules],
  )
  const payrollDate = forecastPayDate(draft, rules)
  const change = useMemo(
    () => shiftChangeSummary(allShifts, { ...draft, breakMinutes: effectiveBreak }, rules, settings, existing?.id),
    [allShifts, draft, effectiveBreak, existing?.id, rules, settings],
  )
  const projectedIsBuffer = change.projected.difference >= 0

  const applyTemplate = (name: TemplateName) => {
    const template = templates[name]
    setDraft((current) => ({ ...current, label: name, ...template }))
  }

  const save = () => {
    onSave({
      ...draft,
      breakMinutes: effectiveBreak,
      source: 'manual',
      sourceTitle: undefined,
    })
  }

  return (
    <section className="card planner-card" aria-labelledby="planner-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Shift impact</span>
          <h2 id="planner-title">{existing ? 'Edit shift' : 'What if I work this shift?'}</h2>
        </div>
        {onCancel && <button className="text-button" onClick={onCancel}>Cancel edit</button>}
      </div>

      <div className="template-row" aria-label="Shift templates">
        {(Object.keys(templates) as TemplateName[]).map((name) => (
          <button type="button" className={draft.label === name ? 'chip active' : 'chip'} key={name} onClick={() => applyTemplate(name)}>{name}</button>
        ))}
      </div>

      <div className="form-grid">
        <label className="wide">Date<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
        <label>Starts<input type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></label>
        {draft.label === 'Early'
          ? <label>Early finish<select value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })}><option value="13:00">1pm</option><option value="14:00">2pm</option><option value="15:00">3pm</option></select></label>
          : <label>Finishes<input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label>}
        <label>Unpaid break<select value={draft.breakMinutes} onChange={(event) => setDraft({ ...draft, breakMinutes: Number(event.target.value) })}>
          {[0, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? 'No break' : `${minutes} minutes`}</option>)}
        </select></label>
        <label className="wide">Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Shift['status'] })}>
          <option value="planned">Planned</option><option value="worked">Worked</option><option value="cancelled">Cancelled</option>
        </select></label>
      </div>
      {assumedMinimumBreak > draft.breakMinutes && <p className="inline-warning">A 20-minute unpaid break will be assumed because this training/study entry is longer than six hours.</p>}

      <div className="impact-grid">
        <div><span>Gross impact</span><strong>{money(result.gross)}</strong></div>
        <div><span>Paid hours</span><strong>{result.paidHours.toFixed(2)}h</strong></div>
        <div><span>Holiday earned</span><strong>{result.holidayHours.toFixed(2)}h</strong></div>
        <div><span>Expected payroll</span><strong>{formatPayrollMonth(payrollDate)}</strong><small>Forecast pay date {DateTime.fromISO(payrollDate).toFormat('d LLL')}</small></div>
      </div>

      <div className={`projected-buffer ${projectedIsBuffer ? 'positive-panel' : 'negative-panel'}`}>
        <span className="eyebrow">After saving</span>
        <strong>{Math.abs(change.projected.bufferHours).toFixed(2)} base-rate hours {projectedIsBuffer ? 'buffer' : 'still needed'}</strong>
        <p>{projectedIsBuffer ? money(change.projected.difference) + ' above' : money(Math.abs(change.projected.difference)) + ' below'} the planning target.</p>
        {existing && <small>This edit {change.paidHoursChange < 0 ? 'removes' : 'adds'} {Math.abs(change.paidHoursChange).toFixed(2)} paid hours and {change.earningsChange < 0 ? 'uses' : 'adds'} {money(Math.abs(change.earningsChange))} of the earnings cushion.</small>}
      </div>

      <details>
        <summary>View pay breakdown</summary>
        <div className="breakdown">
          {result.segments.filter((segment) => segment.paidHours > 0).map((segment) => (
            <div className="breakdown-row" key={`${segment.startsAt}-${segment.endsAt}`}>
              <div><strong>{segment.label}</strong><span>{DateTime.fromISO(segment.startsAt, { setZone: true }).toFormat('ccc HH:mm')}–{DateTime.fromISO(segment.endsAt, { setZone: true }).toFormat('ccc HH:mm')}</span></div>
              <div><strong>{money(segment.gross)}</strong><span>{segment.paidHours.toFixed(2)}h at {segment.multiplier.toFixed(2)}×</span></div>
            </div>
          ))}
        </div>
      </details>

      <button className="primary-button" type="button" onClick={save}>{existing ? 'Save changes' : 'Add this shift'}</button>
      <p className="safety-note">Gross planning estimate only. Net pay will be added after a recent payslip is available.</p>
    </section>
  )
}
