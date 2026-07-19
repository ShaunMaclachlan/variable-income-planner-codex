import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultState } from '../data/defaults'
import { defaultPayRules } from '../domain/rules'
import type { PlannerState } from '../domain/types'
import {
  isSupabaseConfigured,
  loadCloudStore,
  saveCloudStore,
  type CloudSyncStatus,
} from '../services/supabaseSync'

const KEY = 'vip-planner-v0.4'
const LEGACY_KEY = 'vip-planner-v0.3'

export interface PlannerStore {
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

function normaliseStore(value: Partial<PlannerStore>): PlannerStore {
  const profiles = Array.isArray(value.profiles)
    ? value.profiles.map((profile) => normaliseState(
      profile,
      profile as PlannerState,
    ))
    : []

  return {
    activeProfileId: profiles.some((profile) => profile.profile.id === value.activeProfileId)
      ? value.activeProfileId!
      : null,
    profiles: profiles.length > 0 ? profiles : [structuredClone(defaultState)],
  }
}

function loadStore(): PlannerStore {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return normaliseStore(JSON.parse(saved) as Partial<PlannerStore>)

    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<PlannerState>
      return {
        activeProfileId: parsed.profile?.id ?? defaultState.profile.id,
        profiles: [normaliseState(parsed, defaultState)],
      }
    }
  } catch {
    // A damaged local save should never prevent the planner from opening.
  }

  return { activeProfileId: null, profiles: [structuredClone(defaultState)] }
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Cloud backup failed'
}

export function usePersistedState() {
  const [store, setStoreValue] = useState<PlannerStore>(loadStore)
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(
    isSupabaseConfigured ? 'connecting' : 'disabled',
  )
  const [cloudError, setCloudError] = useState<string>()
  const latestStore = useRef(store)
  const cloudReady = useRef(false)
  const state = store.profiles.find((profile) => profile.profile.id === store.activeProfileId)

  useEffect(() => {
    latestStore.current = store
  }, [store])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    const initialiseCloud = async () => {
      try {
        const remote = await loadCloudStore<Partial<PlannerStore>>()
        if (cancelled) return

        if (remote) {
          const next = normaliseStore(remote)
          latestStore.current = next
          localStorage.setItem(KEY, JSON.stringify(next))
          cloudReady.current = true
          setStoreValue(next)
        } else {
          await saveCloudStore(latestStore.current)
          if (cancelled) return
          cloudReady.current = true
        }

        setCloudError(undefined)
        setCloudStatus('synced')
      } catch (error) {
        if (cancelled) return
        setCloudError(messageFrom(error))
        setCloudStatus('error')
      }
    }

    void initialiseCloud()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !cloudReady.current) return
    setCloudStatus('saving')

    const timer = window.setTimeout(() => {
      void saveCloudStore(store)
        .then(() => {
          setCloudError(undefined)
          setCloudStatus('synced')
        })
        .catch((error) => {
          setCloudError(messageFrom(error))
          setCloudStatus('error')
        })
    }, 750)

    return () => window.clearTimeout(timer)
  }, [store])

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
    const value = { ...structuredClone(state), shifts: [] }
    setState(value)
  }, [setState, state])

  return {
    state,
    profiles: store.profiles,
    setState,
    selectProfile,
    createProfile,
    signOut,
    reset,
    cloudStatus,
    cloudError,
  }
}
