import { useCallback, useRef, useState } from 'react'
import { defaultState } from '../data/defaults'
import { migrateSingleProfile, normaliseStore, storeForEncryptedBackup, type PlannerStore } from '../domain/store'
import type { PlannerState } from '../domain/types'

const KEY = 'vip-planner-v0.5'
const LEGACY_KEYS = ['vip-planner-v0.4', 'vip-planner-v0.3']

function loadStore(): PlannerStore {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return normaliseStore(JSON.parse(saved))

    for (const legacyKey of LEGACY_KEYS) {
      const legacy = localStorage.getItem(legacyKey)
      if (!legacy) continue
      const parsed = JSON.parse(legacy) as unknown
      const migrated = legacyKey.endsWith('v0.3') ? migrateSingleProfile(parsed) : normaliseStore(parsed)
      localStorage.setItem(KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch {
    // A damaged local save should never prevent the planner from opening.
  }

  return normaliseStore({ activeProfileId: null, profiles: [structuredClone(defaultState)] })
}

export function usePersistedState() {
  const [store, setStoreValue] = useState<PlannerStore>(loadStore)
  const latestStore = useRef(store)
  latestStore.current = store
  const state = store.profiles.find((profile) => profile.profile.id === store.activeProfileId)

  const saveStore = useCallback((update: (current: PlannerStore) => PlannerStore) => {
    setStoreValue((current) => {
      const next = normaliseStore(update(current))
      latestStore.current = next
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
      ...current,
      activeProfileId: profile.profile.id,
      profiles: [...current.profiles.filter((item) => item.profile.id !== profile.profile.id), profile],
    }))
  }, [saveStore])

  const signOut = useCallback(() => {
    saveStore((current) => ({ ...current, activeProfileId: null }))
  }, [saveStore])

  const reset = useCallback(() => {
    if (!state) return
    setState({ ...structuredClone(state), shifts: [] })
  }, [setState, state])

  const getBackupStore = useCallback(() => storeForEncryptedBackup(latestStore.current), [])
  const restoreBackupStore = useCallback((value: unknown) => {
    const next = normaliseStore(value)
    latestStore.current = next
    localStorage.setItem(KEY, JSON.stringify(next))
    setStoreValue(next)
  }, [])

  return {
    state,
    profiles: store.profiles,
    setState,
    selectProfile,
    createProfile,
    signOut,
    reset,
    getBackupStore,
    restoreBackupStore,
  }
}
