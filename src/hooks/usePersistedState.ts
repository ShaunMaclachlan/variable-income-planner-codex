import { useCallback, useState } from 'react'
import { defaultState } from '../data/defaults'
import { defaultPayRules } from '../domain/rules'
import type { PlannerState } from '../domain/types'

const KEY = 'vip-planner-v0.4'
const LEGACY_KEY = 'vip-planner-v0.3'

interface PlannerStore {
  activeProfileId: string | null
  profiles: PlannerState[]
}

function normaliseState(value: Partial<PlannerState>, fallback: PlannerState): PlannerState {
  return {
    profile: { ...fallback.profile, ...value.profile },
    shifts: Array.isArray(value.shifts) ? value.shifts : structuredClone(fallback.shifts),
    settings: { ...fallback.settings, ...value.settings },
    payRules: { ...defaultPayRules, ...fallback.payRules, ...value.payRules },
    calendarConnection: value.calendarConnection ?? fallback.calendarConnection,
  }
}

function loadStore(): PlannerStore {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<PlannerStore>
      const profiles = Array.isArray(parsed.profiles)
        ? parsed.profiles.map((profile) => normaliseState(profile, profile.profile?.id === 'loren' ? defaultState : profile as PlannerState))
        : []
      return {
        activeProfileId: profiles.some((profile) => profile.profile.id === parsed.activeProfileId) ? parsed.activeProfileId! : null,
        profiles: profiles.length > 0 ? profiles : [structuredClone(defaultState)],
      }
    }

    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<PlannerState>
      return {
        activeProfileId: 'loren',
        profiles: [normaliseState(parsed, defaultState)],
      }
    }
  } catch {
    // A damaged local save should never prevent the planner from opening.
  }

  return { activeProfileId: null, profiles: [structuredClone(defaultState)] }
}

export function usePersistedState() {
  const [store, setStoreValue] = useState<PlannerStore>(loadStore)
  const state = store.profiles.find((profile) => profile.profile.id === store.activeProfileId)

  const saveStore = useCallback((update: (current: PlannerStore) => PlannerStore) => {
    setStoreValue((current) => {
      const next = update(current)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const setState = useCallback((next: PlannerState | ((current: PlannerState) => PlannerState)) => {
    saveStore((current) => ({
      ...current,
      profiles: current.profiles.map((profile) => {
        if (profile.profile.id !== current.activeProfileId) return profile
        return typeof next === 'function' ? next(profile) : next
      }),
    }))
  }, [saveStore])

  const selectProfile = useCallback((id: string) => {
    saveStore((current) => ({ ...current, activeProfileId: id }))
  }, [saveStore])

  const createProfile = useCallback((profile: PlannerState) => {
    saveStore((current) => ({
      activeProfileId: profile.profile.id,
      profiles: [...current.profiles.filter((item) => item.profile.id !== profile.profile.id), profile],
    }))
  }, [saveStore])

  const signOut = useCallback(() => {
    saveStore((current) => ({ ...current, activeProfileId: null }))
  }, [saveStore])

  const reset = useCallback(() => {
    if (!state) return
    const value = state.profile.id === 'loren'
      ? structuredClone(defaultState)
      : { ...structuredClone(state), shifts: [] }
    setState(value)
  }, [setState, state])

  return { state, profiles: store.profiles, setState, selectProfile, createProfile, signOut, reset }
}
