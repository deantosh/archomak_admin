import { getSupabaseEnv } from '@/lib/supabase/config'

export type SupabaseUser = {
  id: string
  email?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

export type SupabaseSession = {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type?: string
  user: SupabaseUser
}

export const ACCESS_COOKIE = 'archomak_access_token'
export const REFRESH_COOKIE = 'archomak_refresh_token'
export const EXPIRES_COOKIE = 'archomak_expires_at'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30
export const REFRESH_BUFFER_SECONDS = 60

function getBaseHeaders() {
  const { supabaseAnonKey } = getSupabaseEnv()

  return {
    apikey: supabaseAnonKey,
    'Content-Type': 'application/json',
  }
}

function getAuthUrl(path: string) {
  const { supabaseUrl } = getSupabaseEnv()
  return `${supabaseUrl}/auth/v1${path}`
}

export function getSessionExpiresAt(session: SupabaseSession) {
  return session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in
}

export function isSessionExpiringSoon(
  expiresAt: number,
  bufferSeconds = REFRESH_BUFFER_SECONDS,
) {
  if (!expiresAt) {
    return true
  }

  return expiresAt - Math.floor(Date.now() / 1000) <= bufferSeconds
}

export const ACCESS_HEADER = 'x-archomak-access-token'
export const REFRESH_HEADER = 'x-archomak-refresh-token'
export const EXPIRES_HEADER = 'x-archomak-expires-at'

export async function requestSessionRefresh(refreshToken: string) {
  try {
    const response = await fetch(getAuthUrl('/token?grant_type=refresh_token'), {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as SupabaseSession
  } catch {
    return null
  }
}

export async function fetchUserWithToken(accessToken: string) {
  try {
    const response = await fetch(getAuthUrl('/user'), {
      headers: {
        ...getBaseHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as SupabaseUser
  } catch {
    return null
  }
}
