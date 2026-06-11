'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { getSupabaseEnv } from '@/lib/supabase/config'
import {
  ACCESS_COOKIE,
  COOKIE_MAX_AGE,
  EXPIRES_COOKIE,
  fetchUserWithToken,
  getSessionExpiresAt,
  isSessionExpiringSoon,
  REFRESH_COOKIE,
  requestSessionRefresh,
  type SupabaseSession,
  type SupabaseUser,
} from '@/lib/supabase/session'

export type { SupabaseSession, SupabaseUser }

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

function readCookie(name: string) {
  const value = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')

  return value ? decodeURIComponent(value) : null
}

export function getClientSessionFromCookies() {
  const accessToken = readCookie(ACCESS_COOKIE)
  const refreshToken = readCookie(REFRESH_COOKIE)
  const expiresAt = Number(readCookie(EXPIRES_COOKIE) ?? 0)

  return {
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
  }
}

export function persistSession(session: SupabaseSession) {
  const expiresAt = getSessionExpiresAt(session)

  setCookie(ACCESS_COOKIE, session.access_token, COOKIE_MAX_AGE)
  setCookie(REFRESH_COOKIE, session.refresh_token, COOKIE_MAX_AGE)
  setCookie(EXPIRES_COOKIE, String(expiresAt), COOKIE_MAX_AGE)
}

export function clearSessionCookies() {
  clearCookie(ACCESS_COOKIE)
  clearCookie(REFRESH_COOKIE)
  clearCookie(EXPIRES_COOKIE)
}

let refreshPromise: Promise<SupabaseSession | null> | null = null

async function refreshSessionOnce(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = requestSessionRefresh(refreshToken).finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function refreshSession() {
  const { refreshToken } = getClientSessionFromCookies()

  if (!refreshToken) {
    return null
  }

  const session = await refreshSessionOnce(refreshToken)

  if (!session) {
    clearSessionCookies()
    return null
  }

  persistSession(session)
  return session
}

export async function ensureValidSession() {
  const { accessToken, refreshToken, expiresAt } = getClientSessionFromCookies()

  if (!accessToken && !refreshToken) {
    return null
  }

  if (accessToken && expiresAt && !isSessionExpiringSoon(expiresAt)) {
    const user = await fetchUserWithToken(accessToken)

    if (user) {
      return {
        accessToken,
        expiresAt,
        user,
      }
    }
  }

  if (!refreshToken) {
    clearSessionCookies()
    return null
  }

  const session = await refreshSessionOnce(refreshToken)

  if (!session) {
    clearSessionCookies()
    return null
  }

  persistSession(session)

  return {
    accessToken: session.access_token,
    expiresAt: getSessionExpiresAt(session),
    user: session.user,
  }
}

export async function signInWithPassword(email: string, password: string) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    return { error: true as const }
  }

  const session = (await response.json()) as SupabaseSession
  persistSession(session)

  return { error: false as const, session }
}

export async function resetPasswordForEmail(email: string, redirectTo: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  return {
    error: Boolean(error) as true | false,
    message: error?.message ?? null,
  }
}

export async function updatePassword(accessToken: string, password: string) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password }),
  })

  return { error: !response.ok }
}

export async function fetchUser(accessToken: string) {
  return fetchUserWithToken(accessToken)
}

export async function verifyRecoveryToken(tokenHash: string, type: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as 'recovery',
  })

  if (error || !data.session) {
    return null
  }

  const session = data.session as SupabaseSession
  persistSession(session)
  return session
}
