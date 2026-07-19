import { describe, expect, it } from 'vitest'
import { normaliseStore, storeForEncryptedBackup } from './store'

describe('local store migrations', () => {
  it('migrates pound fields to integer pence and effective-dated rates', () => {
    const store = normaliseStore({
      activeProfileId: 'legacy',
      profiles: [{
        profile: { id: 'legacy', firstName: 'Example', employer: '' },
        shifts: [],
        settings: { assessmentStart: '2026-07-01', assessmentEnd: '2026-09-30', assessmentTarget: 1234.56, manualHolidayHours: 0 },
        payRules: { baseRate: 17.9 },
      }],
    })
    expect(store.profiles[0].settings.assessmentTargetPence).toBe(123456)
    expect(store.profiles[0].payRules.ratePeriods).toEqual([{ effectiveFrom: '2026-07-01', hourlyRatePence: 1790 }])
  })

  it('excludes calendar bearer links from encrypted backup content', () => {
    const store = normaliseStore({
      activeProfileId: 'demo',
      profiles: [{
        profile: { id: 'demo', firstName: 'Demo', employer: '' }, shifts: [],
        settings: { assessmentStart: '2026-07-01', assessmentEnd: '2026-09-30', assessmentTargetPence: 250000, manualHolidayHours: 0 },
        payRules: { ratePeriods: [{ effectiveFrom: '2026-01-01', hourlyRatePence: 1790 }] },
        calendarConnection: { kind: 'ics-url', name: 'Work', url: 'https://example.com/private.ics' },
      }],
    })
    expect(storeForEncryptedBackup(store).profiles[0].calendarConnection).toBeUndefined()
  })
})
