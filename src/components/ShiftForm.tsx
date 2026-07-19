import { useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { templates, type TemplateName } from '../data/defaults'
import { calculateShift } from '../domain/calculateShift'
import { formatPence } from '../domain/money'
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
  const effectiveBreak = draft.breakMinutes
  const preview = useMemo(() => {
    try {
      if (!draft.date || !draft.start || !draft.end) throw new Error('Enter a valid date, start time and finish time.')
      return {
        result: calculateShift({ ...draft, breakMinutes: effectiveBreak }, rules),
        payrollDate: forecastPayDate(draft, rules),
        change: shiftChangeSummary(allShifts, { ...draft, breakMinutes: effectiveBreak }, rules, settings, existing?.id),
      }
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : 'VIP cannot calculate this shift.' }
    }
  }, [allShifts, draft, effectiveBreak, existing?.id, rules, settings])

  const applyTemplate = (name: TemplateName) => {
    const template = templates[name]
    setDraft((current) => ({ ...current, label: name, ...template }))
  }

  const save = () => {
    if (!preview.result) return
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
      {preview.error && <p className="sync-error" role="alert">{preview.error}</p>}
      {preview.result && preview.change && preview.payrollDate && <>
        {/training|study/i.test(draft.label) && preview.result.elapsedHours > 6 && draft.breakMinutes === 0 && <p className="inline-warning">This entry is longer than six hours. Confirm whether any break is unpaid before relying on the estimate; VIP has not deducted one automatically.</p>}

        <div className="impact-grid">
          <div><span>Gross impact</span><strong>{formatPence(preview.result.grossPence)}</strong></div>
          <div><span>Paid hours</span><strong>{preview.result.paidHours.toFixed(2)}h</strong></div>
          <div><span>Holiday earned</span><strong>{preview.result.holidayHours.toFixed(2)}h</strong></div>
          <div><span>Expected payroll</span><strong>{formatPayrollMonth(preview.payrollDate)}</strong><small>Forecast pay date {DateTime.fromISO(preview.payrollDate).toFormat('d LLL')}</small></div>
        </div>

        <div className={`projected-buffer ${preview.change.projected.differencePence >= 0 ? 'positive-panel' : 'negative-panel'}`}>
          <span className="eyebrow">After saving</span>
          <strong>{Math.abs(preview.change.projected.bufferHours).toFixed(2)} base-rate hours {preview.change.projected.differencePence >= 0 ? 'buffer' : 'still needed'}</strong>
          <p>{preview.change.projected.differencePence >= 0 ? formatPence(preview.change.projected.differencePence) + ' above' : formatPence(Math.abs(preview.change.projected.differencePence)) + ' below'} the planning target.</p>
          {existing && <small>This edit {preview.change.paidHoursChange < 0 ? 'removes' : 'adds'} {Math.abs(preview.change.paidHoursChange).toFixed(2)} paid hours and {preview.change.earningsChangePence < 0 ? 'uses' : 'adds'} {formatPence(Math.abs(preview.change.earningsChangePence))} of the earnings cushion.</small>}
        </div>

        <details>
          <summary>View pay breakdown</summary>
          <div className="breakdown">
            {preview.result.segments.filter((segment) => segment.paidHours > 0).map((segment) => (
              <div className="breakdown-row" key={`${segment.startsAt}-${segment.endsAt}`}>
                <div><strong>{segment.label}</strong><span>{DateTime.fromISO(segment.startsAt, { setZone: true }).toFormat('ccc HH:mm')}–{DateTime.fromISO(segment.endsAt, { setZone: true }).toFormat('ccc HH:mm')}</span></div>
                <div><strong>{formatPence(segment.grossPence)}</strong><span>{segment.paidHours.toFixed(2)}h at {segment.multiplier.toFixed(2)}×</span></div>
              </div>
            ))}
          </div>
        </details>
      </>}

      <button className="primary-button" type="button" disabled={!preview.result} onClick={save}>{existing ? 'Save changes' : 'Add this shift'}</button>
      <p className="safety-note">Gross planning estimate only. Net pay will be added after a recent payslip is available.</p>
    </section>
  )
}
