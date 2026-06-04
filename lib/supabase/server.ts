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

export async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value

  if (!accessToken) {
    return null
  }

  const user = await fetchUser(accessToken)

  if (!user) {
    return null
  }

  return {
    user,
    accessToken,
  }
}
