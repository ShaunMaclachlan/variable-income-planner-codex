import { useCallback, useEffect, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { applyCalendarSyncPlan, buildCalendarSyncPlan, type CalendarSyncPlan } from '../domain/calendarSync'
import { normaliseCalendarUrl, parseIcsCalendar } from '../domain/ical'
import type { CalendarConnection, PlannerState, Shift } from '../domain/types'

interface Props {
  state: PlannerState
  setState: (next: PlannerState | ((current: PlannerState) => PlannerState)) => void
  syncRequest: number
}

function shiftDescription(shift: Shift) {
  return `${DateTime.fromISO(shift.date).toFormat('d LLL')} · ${shift.label} · ${shift.start}–${shift.end}`
}

export function CalendarSync({ state, setState, syncRequest }: Props) {
  const [url, setUrl] = useState(state.calendarConnection?.url ?? '')
  const [plan, setPlan] = useState<CalendarSyncPlan | null>(null)
  const [pendingConnection, setPendingConnection] = useState<CalendarConnection | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const handledRequest = useRef(0)

  const prepareReview = useCallback((text: string, connection?: CalendarConnection) => {
    const parsed = parseIcsCalendar(text)
    const nextPlan = buildCalendarSyncPlan(
      state.shifts,
      parsed.events,
      state.settings.assessmentStart,
      state.settings.assessmentEnd,
      parsed.warnings,
    )
    setPlan(nextPlan)
    setPendingConnection(connection)
    setStatus(`Checked ${parsed.events.length} timed calendar events.`)
  }, [state.settings.assessmentEnd, state.settings.assessmentStart, state.shifts])

  const checkConnection = useCallback(async (connection: CalendarConnection) => {
    setLoading(true)
    setError('')
    setStatus('Checking the calendar…')
    setPlan(null)
    try {
      const response = await fetch(connection.url, { cache: 'no-store', headers: { Accept: 'text/calendar' } })
      if (!response.ok) throw new Error(`The calendar returned ${response.status}.`)
      prepareReview(await response.text(), connection)
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : 'Unknown calendar error.'
      setError(`VIP could not read this link from the browser. ${detail} Try the .ics file option below.`)
      setStatus('')
    } finally {
      setLoading(false)
    }
  }, [prepareReview])

  useEffect(() => {
    if (!state.calendarConnection || syncRequest <= 0 || handledRequest.current === syncRequest) return
    handledRequest.current = syncRequest
    void checkConnection(state.calendarConnection)
  }, [checkConnection, state.calendarConnection, syncRequest])

  const connect = () => {
    try {
      const secureUrl = normaliseCalendarUrl(url)
      const connection: CalendarConnection = { kind: 'ics-url', name: 'Apple / rota calendar', url: secureUrl }
      setUrl(secureUrl)
      void checkConnection(connection)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Enter a valid calendar link.')
    }
  }

  const importFile = async (file?: File) => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      prepareReview(await file.text())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'VIP could not read that calendar file.')
    } finally {
      setLoading(false)
    }
  }

  const apply = () => {
    if (!plan) return
    const syncedAt = new Date().toISOString()
    setState((current) => ({
      ...current,
      shifts: applyCalendarSyncPlan(current.shifts, plan),
      calendarConnection: pendingConnection
        ? { ...pendingConnection, lastSyncedAt: syncedAt }
        : current.calendarConnection
          ? { ...current.calendarConnection, lastSyncedAt: syncedAt }
          : undefined,
    }))
    setPlan(null)
    setPendingConnection(undefined)
    setStatus('Calendar sync applied. Your forecast and hours cushion are up to date.')
  }

  const disconnect = () => {
    if (!window.confirm('Disconnect this calendar? Imported shifts will stay in VIP.')) return
    setState((current) => ({ ...current, calendarConnection: undefined }))
    setUrl('')
    setPlan(null)
    setStatus('Calendar disconnected. Existing shifts were kept.')
  }

  const changes = plan ? plan.additions.length + plan.updates.length : 0

  return <>
    <section className="card calendar-card">
      <div className="section-heading">
        <div><span className="eyebrow">Read-only connection</span><h2>{state.calendarConnection ? 'Connected calendar' : 'Connect Apple Calendar'}</h2></div>
        {state.calendarConnection && <span className="status good">Connected</span>}
      </div>

      {state.calendarConnection ? <>
        <div className="connection-row">
          <div className="calendar-mark">CAL</div>
          <div><strong>{state.calendarConnection.name}</strong><span>{state.calendarConnection.lastSyncedAt ? `Last synced ${DateTime.fromISO(state.calendarConnection.lastSyncedAt).toRelative()}` : 'Ready for first sync'}</span></div>
        </div>
        <button className="primary-button" disabled={loading} onClick={() => void checkConnection(state.calendarConnection!)}>{loading ? 'Checking calendar…' : 'Sync calendar now'}</button>
        <button className="text-button disconnect-button" onClick={disconnect}>Disconnect calendar</button>
      </> : <>
        <p className="calendar-intro">Paste the read-only subscription link for Loren’s work rota. VIP will only consider recognised Phyllis Tuckwell work entries inside the assessment period.</p>
        <label className="calendar-url">Calendar subscription link<input type="url" value={url} placeholder="webcal://… or https://…/calendar.ics" onChange={(event) => setUrl(event.target.value)} /></label>
        <button className="primary-button" disabled={loading || !url.trim()} onClick={connect}>{loading ? 'Checking calendar…' : 'Connect and check calendar'}</button>
        <details className="calendar-help">
          <summary>Where to find the Apple calendar link</summary>
          <ol>
            <li>In Calendar, tap <strong>Calendars</strong>, then the information button beside the work calendar.</li>
            <li>If it is a subscribed iRota calendar, use its original subscription link.</li>
            <li>If it is an iCloud calendar, only share a separate work calendar—not Loren’s personal calendar.</li>
          </ol>
          <p>A public iCloud link is read-only, but anyone who obtains it can view that calendar.</p>
          <a href="https://support.apple.com/guide/iphone/share-icloud-calendars-iph7613c4fb/ios" target="_blank" rel="noreferrer">Open Apple’s sharing instructions</a>
        </details>
      </>}

      <div className="file-fallback">
        <div><strong>Calendar link not working?</strong><span>Choose an exported .ics file and VIP will run the same safe review.</span></div>
        <label className="file-button">Choose .ics file<input type="file" accept=".ics,text/calendar" onChange={(event) => { void importFile(event.target.files?.[0]); event.target.value = '' }} /></label>
      </div>
      {status && <p className="sync-status" role="status">{status}</p>}
      {error && <p className="sync-error" role="alert">{error}</p>}
    </section>

    {plan && <section className="card sync-review">
      <div className="section-heading"><div><span className="eyebrow">Review before applying</span><h2>Calendar check results</h2></div><span className={changes > 0 ? 'status warning' : 'status good'}>{changes} changes</span></div>
      <div className="sync-counts">
        <div><strong>{plan.additions.length}</strong><span>New</span></div>
        <div><strong>{plan.updates.length}</strong><span>Changed</span></div>
        <div><strong>{plan.protected.length}</strong><span>Protected</span></div>
        <div><strong>{plan.unchanged}</strong><span>Same</span></div>
      </div>

      {plan.additions.map((shift) => <div className="sync-row" key={`add-${shift.id}`}><span className="sync-badge add">New</span><div><strong>{shiftDescription(shift)}</strong><small>{shift.sourceTitle}</small></div></div>)}
      {plan.updates.map(({ before, after }) => <div className="sync-row" key={`update-${before.id}`}><span className="sync-badge change">Change</span><div><strong>{shiftDescription(after)}</strong><small>Was {before.start}–{before.end}</small></div></div>)}
      {plan.protected.map((shift) => <div className="sync-row" key={`protected-${shift.id}`}><span className="sync-badge keep">Kept</span><div><strong>{shiftDescription(shift)}</strong><small>{shift.source === 'email' ? 'Email override takes priority' : 'Manual or confirmed entry takes priority'}</small></div></div>)}

      {plan.ignored > 0 && <p className="fine-print">Ignored {plan.ignored} unrelated or out-of-period events.</p>}
      {plan.warnings.map((warning) => <p className="inline-warning" key={warning}>{warning}</p>)}
      <button className="primary-button" onClick={apply}>{changes > 0 ? `Apply ${changes} calendar ${changes === 1 ? 'change' : 'changes'}` : 'Finish sync'}</button>
      <button className="secondary-button" onClick={() => { setPlan(null); setPendingConnection(undefined); setStatus('No calendar changes were applied.') }}>Cancel</button>
    </section>}

    <p className="safety-note calendar-safety">VIP never edits the calendar. The subscription link and imported shifts stay in this browser profile.</p>
  </>
}
