import { useCallback, useState } from 'react'
import { defaultState } from '../data/defaults'
import type { PlannerState } from '../domain/types'

const KEY = 'vip-planner-v0.1'

function loadState(): PlannerState {
  try {
    const saved = localStorage.getItem(KEY)
    if (!saved) return structuredClone(defaultState)
    const parsed = JSON.parse(saved) as Partial<PlannerState>
    return {
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : structuredClone(defaultState.shifts),
      settings: { ...defaultState.settings, ...parsed.settings },
    }
  } catch {
    return structuredClone(defaultState)
  }
}

export function usePersistedState() {
  const [state, setStateValue] = useState<PlannerState>(loadState)

  const setState = useCallback((next: PlannerState | ((current: PlannerState) => PlannerState)) => {
    setStateValue((current) => {
      const value = typeof next === 'function' ? next(current) : next
      localStorage.setItem(KEY, JSON.stringify(value))
      return value
    })
  }, [])

  const reset = useCallback(() => {
    const value = structuredClone(defaultState)
    localStorage.setItem(KEY, JSON.stringify(value))
    setStateValue(value)
  }, [])

  return { state, setState, reset }
}
