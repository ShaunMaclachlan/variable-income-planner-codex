import { useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { templates, type TemplateName } from '../data/defaults'
import { calculateShift } from '../domain/calculateShift'
import type { PayRules, Shift } from '../domain/types'

interface Props {
  rules: PayRules
  existing?: Shift
  currentMonthGross: number
  retention: number
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
    overtimeMultiplier: 1,
    status: 'planned',
  }
}

export function ShiftForm({ rules, existing, currentMonthGross, retention, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(() => initialDraft(existing))
  const result = useMemo(() => calculateShift(draft, rules), [draft, rules])

  const applyTemplate = (name: TemplateName) => {
    const template = templates[name]
    setDraft((current) => ({ ...current, label: name, ...template }))
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
        <label>Finishes<input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label>
        <label>Unpaid break<select value={draft.breakMinutes} onChange={(event) => setDraft({ ...draft, breakMinutes: Number(event.target.value) })}>
          {[0, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? 'No break' : `${minutes} minutes`}</option>)}
        </select></label>
        <label>Overtime<select value={draft.overtimeMultiplier} onChange={(event) => setDraft({ ...draft, overtimeMultiplier: Number(event.target.value) })}>
          {[1, 1.25, 1.5, 2].map((multiplier) => <option key={multiplier} value={multiplier}>{multiplier === 1 ? 'No overtime' : `${multiplier}×`}</option>)}
        </select></label>
        <label className="wide">Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Shift['status'] })}>
          <option value="planned">Planned</option><option value="worked">Worked</option><option value="cancelled">Cancelled</option>
        </select></label>
      </div>

      <div className="impact-grid">
        <div><span>Gross impact</span><strong>{money(result.gross)}</strong></div>
        <div><span>Indicative take-home</span><strong>{money(result.gross * retention)}</strong></div>
        <div><span>Paid hours</span><strong>{result.paidHours.toFixed(2)}h</strong></div>
        <div><span>Holiday earned</span><strong>{result.holidayHours.toFixed(2)}h</strong></div>
        <div><span>Monthly gross becomes</span><strong>{money(currentMonthGross + result.gross)}</strong></div>
      </div>

      <details>
        <summary>View pay breakdown</summary>
        <div className="breakdown">
          {result.segments.filter((segment) => segment.paidHours > 0).map((segment) => (
            <div className="breakdown-row" key={`${segment.startsAt}-${segment.endsAt}`}>
              <div><strong>{segment.label}</strong><span>{DateTime.fromISO(segment.startsAt, { setZone: true }).toFormat('ccc HH:mm')}–{DateTime.fromISO(segment.endsAt, { setZone: true }).toFormat('ccc HH:mm')}</span></div>
              <div><strong>{money(segment.gross)}</strong><span>{segment.paidHours.toFixed(2)}h at {(segment.multiplier * segment.overtimeMultiplier).toFixed(2)}×</span></div>
            </div>
          ))}
        </div>
      </details>

      <button className="primary-button" type="button" onClick={() => onSave(draft)}>{existing ? 'Save changes' : 'Add this shift'}</button>
      <p className="safety-note">Planning estimate only. Rates marked as provisional are listed in Settings.</p>
    </section>
  )
}
