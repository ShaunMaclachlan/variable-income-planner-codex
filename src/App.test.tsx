import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('VIP app', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  const continueAsDemo = () => {
    fireEvent.click(screen.getByRole('button', { name: /Demo/ }))
  }

  it('opens with an anonymised device-profile chooser', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Who is planning?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Demo/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create another profile' })).toBeInTheDocument()
  })

  it('renders a transparent planning dashboard', () => {
    render(<App />)
    continueAsDemo()
    expect(screen.getByText(/Demo/)).toBeInTheDocument()
    expect(screen.getByText('Assessment progress')).toBeInTheDocument()
    expect(screen.getByText('No upcoming shifts recorded.')).toBeInTheDocument()
    expect(screen.getByText(/not an eligibility decision/i)).toBeInTheDocument()
  })

  it('opens the shift impact planner from the primary action', () => {
    render(<App />)
    continueAsDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Plan a shift' }))
    expect(screen.getByRole('heading', { name: 'What if I work this shift?' })).toBeInTheDocument()
    expect(screen.getByText('Gross impact')).toBeInTheDocument()
    expect(screen.getByText('View pay breakdown')).toBeInTheDocument()
  })

  it('shows the confirmed contract rules in settings', () => {
    render(<App />)
    continueAsDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByText('Current contract rules')).toBeInTheDocument()
    expect(screen.getByText('Public holiday worked')).toBeInTheDocument()
    expect(screen.getByText(/Highest-rate hours first/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Encrypted device backup' })).toBeInTheDocument()
  })

  it('offers all three confirmed early finish choices', () => {
    render(<App />)
    continueAsDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Plan a shift' }))
    expect(screen.getByRole('option', { name: '1pm' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '2pm' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '3pm' })).toBeInTheDocument()
  })

  it('uses the confirmed 12pm–8pm late template', () => {
    render(<App />)
    continueAsDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Plan a shift' }))
    fireEvent.click(screen.getByRole('button', { name: 'Late' }))
    expect(screen.getByLabelText('Starts')).toHaveValue('12:00')
    expect(screen.getByLabelText('Finishes')).toHaveValue('20:00')
  })

  it('offers a provider-neutral Apple calendar connection and safe file fallback', () => {
    render(<App />)
    continueAsDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Connect calendar' }))

    expect(screen.getByRole('heading', { name: 'Sync your shifts' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Connect Apple Calendar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Calendar subscription link')).toBeInTheDocument()
    expect(screen.getByText('Choose .ics file')).toBeInTheDocument()
    expect(screen.getByText(/VIP never edits the calendar/i)).toBeInTheDocument()
  })

  it('checks a connected calendar, previews a new shift and applies it only after review', async () => {
    const calendar = `BEGIN:VCALENDAR\r
VERSION:2.0\r
BEGIN:VEVENT\r
UID:new-night@example.com\r
SUMMARY:Night shift Example Employer\r
DTSTART;TZID=Europe/London:20260901T190000\r
DTEND;TZID=Europe/London:20260902T073000\r
END:VEVENT\r
END:VCALENDAR`
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(calendar, { status: 200 }))
    render(<App />)
    continueAsDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Connect calendar' }))
    fireEvent.change(screen.getByLabelText('Calendar subscription link'), { target: { value: 'webcal://example.com/rota.ics' } })
    fireEvent.click(screen.getByRole('button', { name: 'Connect and check calendar' }))

    expect(await screen.findByRole('heading', { name: 'Calendar check results' })).toBeInTheDocument()
    expect(screen.getByText('1 Sep · Night · 19:00–07:30')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Apply 1 calendar change' }))
    expect(screen.getByText(/Calendar sync applied/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Shifts' }))
    expect(screen.getByRole('button', { name: 'Edit Night on 1 September 2026' })).toBeInTheDocument()
  })

  it('previews a hand-entered weekday early shift', () => {
    render(<App />)
    continueAsDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Plan a shift' }))
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-07-07' } })
    expect(screen.getAllByText('£125.30')).not.toHaveLength(0)
  })

  it('creates a personalised blank plan for another user', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Create another profile' }))
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Alex' } })
    fireEvent.change(screen.getByLabelText('Employer (optional)'), { target: { value: 'Example Care' } })
    fireEvent.change(screen.getByLabelText('Base hourly rate (£)'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('Assessment target (£)'), { target: { value: '2500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create my plan' }))

    expect(screen.getByRole('heading', { name: /Alex/ })).toBeInTheDocument()
    expect(screen.getByText(/Example Care/)).toBeInTheDocument()
    expect(screen.getByText('No upcoming shifts recorded.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByLabelText('Base hourly rate (£)')).toHaveValue(20)
    expect(screen.getByText('Not set')).toBeInTheDocument()
  })

  it('personalises calendar setup for another user', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Create another profile' }))
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Alex' } })
    fireEvent.change(screen.getByLabelText('Employer (optional)'), { target: { value: 'Example Care' } })
    fireEvent.change(screen.getByLabelText('Base hourly rate (£)'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('Assessment target (£)'), { target: { value: '2500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create my plan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Connect calendar' }))

    expect(screen.getByText(/Alex’s work rota/)).toBeInTheDocument()
    expect(screen.queryByText(/Demo’s work rota/)).not.toBeInTheDocument()
  })
})
