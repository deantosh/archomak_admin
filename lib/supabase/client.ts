'use client'

import { getSupabaseEnv } from '@/lib/supabase/config'

type SupabaseUser = {
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

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function persistSession(session: SupabaseSession) {
  const expiresAt =
    session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in

  setCookie(ACCESS_COOKIE, session.access_token, COOKIE_MAX_AGE)
  setCookie(REFRESH_COOKIE, session.refresh_token, COOKIE_MAX_AGE)
  setCookie(EXPIRES_COOKIE, String(expiresAt), COOKIE_MAX_AGE)
}

export function clearSessionCookies() {
  clearCookie(ACCESS_COOKIE)
  clearCookie(REFRESH_COOKIE)
  clearCookie(EXPIRES_COOKIE)
}

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch(getAuthUrl('/token?grant_type=password'), {
    method: 'POST',
    headers: getBaseHeaders(),
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
  const recoverUrl = new URL(getAuthUrl('/recover'))
  recoverUrl.searchParams.set('redirect_to', redirectTo)

  const response = await fetch(recoverUrl.toString(), {
    method: 'POST',
    headers: getBaseHeaders(),
    body: JSON.stringify({
      email,
      redirect_to: redirectTo,
    }),
  })

  if (response.ok) {
    return { error: false as const, message: null }
  }

  let message = 'We could not send the reset link right now. Please try again.'

  try {
    const data = (await response.json()) as { msg?: string; message?: string; error_description?: string }
    message =
      data.error_description ??
      data.message ??
      data.msg ??
      message
  } catch {
    // Keep the fallback message when the response body is not JSON.
  }

  return { error: true as const, message }
}

export async function updatePassword(accessToken: string, password: string) {
  const response = await fetch(getAuthUrl('/user'), {
    method: 'PUT',
    headers: {
      ...getBaseHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password }),
  })

  return { error: !response.ok }
}

export async function fetchUser(accessToken: string) {
  const response = await fetch(getAuthUrl('/user'), {
    headers: {
      ...getBaseHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as SupabaseUser
}

export async function verifyRecoveryToken(tokenHash: string, type: string) {
  const response = await fetch(getAuthUrl('/verify'), {
    method: 'POST',
    headers: getBaseHeaders(),
    body: JSON.stringify({
      token_hash: tokenHash,
      type,
    }),
  })

  if (!response.ok) {
    return null
  }

  const session = (await response.json()) as SupabaseSession
  persistSession(session)
  return session
}
