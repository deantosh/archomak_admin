'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import {
  clearSessionCookies,
  ensureValidSession,
  getClientSessionFromCookies,
} from '@/lib/supabase/client'
import { REFRESH_BUFFER_SECONDS } from '@/lib/supabase/session'

const MIN_REFRESH_INTERVAL_MS = 30_000

export function SessionRefresher() {
  const router = useRouter()

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    async function scheduleRefresh() {
      const session = await ensureValidSession()

      if (cancelled) {
        return
      }

      if (!session) {
        clearSessionCookies()
        router.replace('/?error=auth')
        return
      }

      const secondsUntilRefresh = Math.max(
        session.expiresAt - REFRESH_BUFFER_SECONDS - Math.floor(Date.now() / 1000),
        MIN_REFRESH_INTERVAL_MS / 1000,
      )

      timeoutId = setTimeout(scheduleRefresh, secondsUntilRefresh * 1000)
    }

    const { accessToken, refreshToken } = getClientSessionFromCookies()

    if (accessToken || refreshToken) {
      void scheduleRefresh()
    }

    return () => {
      cancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [router])

  return null
}
