import { defaultState } from '../data/defaults'
import { poundsToPence } from './money'
import { defaultPayRules } from './rules'
import type { PayRules, PlannerSettings, PlannerState } from './types'

export const STORE_SCHEMA_VERSION = 1

export interface PlannerStore {
  schemaVersion: number
  activeProfileId: string | null
  profiles: PlannerState[]
}

type LegacyPayRules = Partial<PayRules> & { baseRate?: number }
type LegacySettings = Partial<PlannerSettings> & { assessmentTarget?: number }
type LegacyState = Partial<Omit<PlannerState, 'payRules' | 'settings'>> & {
  payRules?: LegacyPayRules
  settings?: LegacySettings
}

function normaliseState(value: LegacyState, fallback: PlannerState): PlannerState {
  const savedRules = value.payRules ?? {}
  const savedSettings = value.settings ?? {}
  const ratePeriods = Array.isArray(savedRules.ratePeriods) && savedRules.ratePeriods.length > 0
    ? savedRules.ratePeriods
    : typeof savedRules.baseRate === 'number'
      ? [{ effectiveFrom: savedSettings.assessmentStart ?? fallback.settings.assessmentStart, hourlyRatePence: poundsToPence(savedRules.baseRate) }]
      : fallback.payRules.ratePeriods

  return {
    profile: { ...fallback.profile, ...value.profile },
    shifts: Array.isArray(value.shifts) ? value.shifts : structuredClone(fallback.shifts),
    settings: {
      ...fallback.settings,
      ...savedSettings,
      assessmentTargetPence: typeof savedSettings.assessmentTargetPence === 'number'
        ? Math.round(savedSettings.assessmentTargetPence)
        : typeof savedSettings.assessmentTarget === 'number'
          ? poundsToPence(savedSettings.assessmentTarget)
          : fallback.settings.assessmentTargetPence,
    },
    payRules: {
      ...defaultPayRules,
      ...fallback.payRules,
      ...savedRules,
      ratePeriods,
    },
    calendarConnection: value.calendarConnection ?? fallback.calendarConnection,
  }
}

export function normaliseStore(value: unknown): PlannerStore {
  const input = value && typeof value === 'object' ? value as Partial<PlannerStore> : {}
  const profiles = Array.isArray(input.profiles)
    ? input.profiles.map((profile) => normaliseState(
      profile as LegacyState,
      {
        ...structuredClone(defaultState),
        profile: { ...defaultState.profile, ...(profile as LegacyState).profile },
      },
    ))
    : []

  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    activeProfileId: profiles.some((profile) => profile.profile.id === input.activeProfileId)
      ? input.activeProfileId!
      : null,
    profiles: profiles.length > 0 ? profiles : [structuredClone(defaultState)],
  }
}

export function migrateSingleProfile(value: unknown): PlannerStore {
  const parsed = value && typeof value === 'object' ? value as LegacyState : {}
  const profile = normaliseState(parsed, defaultState)
  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    activeProfileId: profile.profile.id,
    profiles: [profile],
  }
}

export function storeForEncryptedBackup(store: PlannerStore): PlannerStore {
  return {
    ...structuredClone(store),
    profiles: store.profiles.map((profile) => ({ ...structuredClone(profile), calendarConnection: undefined })),
  }
}
