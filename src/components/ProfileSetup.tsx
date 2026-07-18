import { useState } from 'react'
import { DateTime } from 'luxon'
import { newProfileState } from '../data/defaults'
import type { PlannerState } from '../domain/types'

interface Props {
  profiles: PlannerState[]
  onSelect: (id: string) => void
  onCreate: (profile: PlannerState) => void
}

function profileId(name: string) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile'
  return `${slug}-${crypto.randomUUID().slice(0, 8)}`
}

export function ProfileSetup({ profiles, onSelect, onCreate }: Props) {
  const today = DateTime.now().setZone('Europe/London')
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [employer, setEmployer] = useState('')
  const [baseRate, setBaseRate] = useState(0)
  const [assessmentStart, setAssessmentStart] = useState(today.toISODate()!)
  const [assessmentEnd, setAssessmentEnd] = useState(today.plus({ months: 3 }).toISODate()!)
  const [assessmentTarget, setAssessmentTarget] = useState(0)

  const create = () => {
    if (!firstName.trim() || baseRate <= 0 || assessmentTarget <= 0) return
    const id = profileId(firstName)
    onCreate(newProfileState(
      { id, firstName: firstName.trim(), employer: employer.trim() },
      { assessmentStart, assessmentEnd, assessmentTarget, manualHolidayHours: 0 },
      baseRate,
    ))
  }

  return (
    <div className="setup-shell">
      <div className="setup-brand"><span>VIP</span><strong>Variable Income Planner</strong></div>
      <section className="setup-card">
        <span className="eyebrow">Welcome</span>
        <h1>Who is planning?</h1>
        <p>Choose a saved profile or create your own. Your plans stay on this device.</p>

        <div className="profile-list">
          {profiles.map((profile) => (
            <button className="profile-choice" key={profile.profile.id} onClick={() => onSelect(profile.profile.id)}>
              <span className="profile-initial">{profile.profile.firstName.slice(0, 1).toUpperCase()}</span>
              <span><strong>{profile.profile.firstName}</strong><small>{profile.profile.employer || 'Personal plan'}</small></span>
              <b>Continue</b>
            </button>
          ))}
        </div>

        {!showForm
          ? <button className="secondary-button" onClick={() => setShowForm(true)}>Create another profile</button>
          : <div className="setup-form">
            <div className="section-heading"><div><span className="eyebrow">New profile</span><h2>Tell VIP the essentials</h2></div><button className="text-button" onClick={() => setShowForm(false)}>Cancel</button></div>
            <div className="form-grid">
              <label>First name<input autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
              <label>Employer (optional)<input value={employer} onChange={(event) => setEmployer(event.target.value)} /></label>
              <label>Base hourly rate (£)<input type="number" min="0" step="0.01" value={baseRate || ''} onChange={(event) => setBaseRate(Number(event.target.value))} /></label>
              <label>Assessment target (£)<input type="number" min="0" step="0.01" value={assessmentTarget || ''} onChange={(event) => setAssessmentTarget(Number(event.target.value))} /></label>
              <label>Assessment starts<input type="date" value={assessmentStart} onChange={(event) => setAssessmentStart(event.target.value)} /></label>
              <label>Assessment ends<input type="date" value={assessmentEnd} onChange={(event) => setAssessmentEnd(event.target.value)} /></label>
            </div>
            <button className="primary-button" disabled={!firstName.trim() || baseRate <= 0 || assessmentTarget <= 0} onClick={create}>Create my plan</button>
            <p className="safety-note">New profiles start without night or weekend enhancements or holiday accrual. Add the rules from your contract in Settings before relying on the forecast.</p>
          </div>}
      </section>
      <p className="setup-note">This is a device profile, not a secure online account. Cloud accounts and syncing will come later.</p>
    </div>
  )
}
