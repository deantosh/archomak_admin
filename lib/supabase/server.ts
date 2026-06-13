import { cookies, headers } from 'next/headers'

import {
  ACCESS_COOKIE,
  ACCESS_HEADER,
  EXPIRES_COOKIE,
  EXPIRES_HEADER,
  fetchUserWithToken,
  isSessionExpiringSoon,
  REFRESH_COOKIE,
  REFRESH_HEADER,
  requestSessionRefresh,
  type SupabaseUser,
} from '@/lib/supabase/session'

async function readSessionFromRequest() {
  const headerStore = await headers()
  const cookieStore = await cookies()

  const accessToken =
    headerStore.get(ACCESS_HEADER) ?? cookieStore.get(ACCESS_COOKIE)?.value ?? null
  const refreshToken =
    headerStore.get(REFRESH_HEADER) ?? cookieStore.get(REFRESH_COOKIE)?.value ?? null
  const expiresAt = Number(
    headerStore.get(EXPIRES_HEADER) ?? cookieStore.get(EXPIRES_COOKIE)?.value ?? 0,
  )

  return {
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
  }
}

export async function getAuthenticatedUser() {
  const { accessToken, refreshToken, expiresAt } = await readSessionFromRequest()

  if (!accessToken && !refreshToken) {
    return null
  }

  if (accessToken && expiresAt && !isSessionExpiringSoon(expiresAt)) {
    const user = await fetchUserWithToken(accessToken)

    if (user) {
      return {
        user,
        accessToken,
      }
    }
  }

  if (!refreshToken) {
    return null
  }

  const session = await requestSessionRefresh(refreshToken)

  if (!session) {
    return null
  }

  return {
    user: session.user as SupabaseUser,
    accessToken: session.access_token,
  }
}
