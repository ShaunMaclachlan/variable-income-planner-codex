import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('VIP app', () => {
  beforeEach(() => localStorage.clear())

  it('renders a transparent planning dashboard', () => {
    render(<App />)
    expect(screen.getByText(/Loren/)).toBeInTheDocument()
    expect(screen.getByText('Assessment progress')).toBeInTheDocument()
    expect(screen.getByText(/not an eligibility decision/i)).toBeInTheDocument()
  })

  it('opens the shift impact planner from the primary action', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Plan a shift' }))
    expect(screen.getByRole('heading', { name: 'What if I work this shift?' })).toBeInTheDocument()
    expect(screen.getByText('Gross impact')).toBeInTheDocument()
    expect(screen.getByText('View pay breakdown')).toBeInTheDocument()
  })

  it('shows provisional assumptions in settings', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByText('Current assumptions')).toBeInTheDocument()
    expect(screen.getByText(/Public holiday/)).toBeInTheDocument()
    expect(screen.getByText(/payslip confirmation/)).toBeInTheDocument()
  })
})
