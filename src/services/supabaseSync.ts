const projectUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const SESSION_KEY = 'vip-supabase-session-v1'

export type CloudSyncStatus = 'disabled' | 'connecting' | 'saving' | 'synced' | 'error'

interface StoredSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
  userId: string
}

interface AuthResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  expires_at?: number
  user?: { id?: string }
  message?: string
  error_description?: string
  msg?: string
}

interface PlannerStateRow<T> {
  store: T
  updated_at: string
}

export const isSupabaseConfigured = Boolean(projectUrl && publishableKey)

function errorMessage(value: unknown, fallback: string): string {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['message', 'error_description', 'msg']) {
      if (typeof record[key] === 'string' && record[key]) return record[key]
    }
  }
  return fallback
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as T | null
  if (!response.ok) throw new Error(errorMessage(body, `Supabase request failed (${response.status})`))
  return body as T
}

function authHeaders(accessToken = publishableKey): HeadersInit {
  if (!publishableKey) return {}
  return {
    apikey: publishableKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<StoredSession>
    if (!value.accessToken || !value.refreshToken || !value.expiresAt || !value.userId) return null
    return value as StoredSession
  } catch {
    return null
  }
}

function storeSession(response: AuthResponse, fallbackUserId?: string): StoredSession {
  const accessToken = response.access_token
  const refreshToken = response.refresh_token
  const userId = response.user?.id ?? fallbackUserId
  if (!accessToken || !refreshToken || !userId) throw new Error('Supabase did not return a complete session')

  const expiresAt = response.expires_at
    ?? Math.floor(Date.now() / 1000) + (response.expires_in ?? 3600)
  const session = { accessToken, refreshToken, expiresAt, userId }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

async function createAnonymousSession(): Promise<StoredSession> {
  if (!projectUrl || !publishableKey) throw new Error('Supabase is not configured')
  const response = await fetch(`${projectUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: authHeaders(),
    body: '{}',
  })
  return storeSession(await parseResponse<AuthResponse>(response))
}

async function refreshSession(session: StoredSession): Promise<StoredSession> {
  if (!projectUrl) throw new Error('Supabase is not configured')
  const response = await fetch(`${projectUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  })
  return storeSession(await parseResponse<AuthResponse>(response), session.userId)
}

async function ensureSession(): Promise<StoredSession> {
  const stored = readStoredSession()
  const now = Math.floor(Date.now() / 1000)
  if (stored && stored.expiresAt > now + 60) return stored

  if (stored) {
    try {
      return await refreshSession(stored)
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  return createAnonymousSession()
}

export async function loadCloudStore<T>(): Promise<T | null> {
  if (!projectUrl || !publishableKey) return null
  const session = await ensureSession()
  const response = await fetch(
    `${projectUrl}/rest/v1/planner_states?select=store,updated_at&user_id=eq.${session.userId}&limit=1`,
    { headers: authHeaders(session.accessToken) },
  )
  const rows = await parseResponse<PlannerStateRow<T>[]>(response)
  return rows[0]?.store ?? null
}

export async function saveCloudStore<T>(store: T): Promise<void> {
  if (!projectUrl || !publishableKey) return
  const session = await ensureSession()
  const response = await fetch(`${projectUrl}/rest/v1/planner_states?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      ...authHeaders(session.accessToken),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: session.userId,
      store,
      updated_at: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(errorMessage(body, `Supabase save failed (${response.status})`))
  }
}
