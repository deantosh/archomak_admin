import { cookies } from 'next/headers'

import { getSupabaseEnv } from '@/lib/supabase/config'

type SupabaseUser = {
  id: string
  email?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

type SupabaseSession = {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type?: string
  user: SupabaseUser
}

const ACCESS_COOKIE = 'archomak_access_token'
const REFRESH_COOKIE = 'archomak_refresh_token'
const EXPIRES_COOKIE = 'archomak_expires_at'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

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

async function persistSession(session: SupabaseSession) {
  const cookieStore = await cookies()
  const expiresAt =
    session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in

  cookieStore.set(ACCESS_COOKIE, session.access_token, {
    path: '/',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })
  cookieStore.set(REFRESH_COOKIE, session.refresh_token, {
    path: '/',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })
  cookieStore.set(EXPIRES_COOKIE, String(expiresAt), {
    path: '/',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function clearServerSession() {
  const cookieStore = await cookies()

  cookieStore.set(ACCESS_COOKIE, '', { path: '/', sameSite: 'lax', maxAge: 0 })
  cookieStore.set(REFRESH_COOKIE, '', { path: '/', sameSite: 'lax', maxAge: 0 })
  cookieStore.set(EXPIRES_COOKIE, '', { path: '/', sameSite: 'lax', maxAge: 0 })
}

async function fetchUser(accessToken: string) {
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
}

async function refreshSession(refreshToken: string) {
  const response = await fetch(getAuthUrl('/token?grant_type=refresh_token'), {
    method: 'POST',
    headers: getBaseHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  const session = (await response.json()) as SupabaseSession
  await persistSession(session)
  return session
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  const expiresAtRaw = cookieStore.get(EXPIRES_COOKIE)?.value
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0
  const now = Math.floor(Date.now() / 1000)

  let currentAccessToken = accessToken
  let currentRefreshToken = refreshToken

  if ((!currentAccessToken || (expiresAt && expiresAt <= now + 30)) && currentRefreshToken) {
    const refreshed = await refreshSession(currentRefreshToken)

    if (!refreshed) {
      await clearServerSession()
      return null
    }

    currentAccessToken = refreshed.access_token
    currentRefreshToken = refreshed.refresh_token
  }

  if (!currentAccessToken) {
    return null
  }

  let user = await fetchUser(currentAccessToken)

  if (!user && currentRefreshToken) {
    const refreshed = await refreshSession(currentRefreshToken)

    if (!refreshed) {
      await clearServerSession()
      return null
    }

    currentAccessToken = refreshed.access_token
    user = await fetchUser(currentAccessToken)
  }

  if (!user) {
    await clearServerSession()
    return null
  }

  return {
    user,
    accessToken: currentAccessToken,
  }
}
