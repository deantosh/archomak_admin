import { NextResponse, type NextRequest } from 'next/server'

import { hasSupabaseEnv } from '@/lib/supabase/config'
import {
  ACCESS_COOKIE,
  COOKIE_MAX_AGE,
  ACCESS_HEADER,
  EXPIRES_COOKIE,
  EXPIRES_HEADER,
  getSessionExpiresAt,
  isSessionExpiringSoon,
  REFRESH_COOKIE,
  REFRESH_HEADER,
  requestSessionRefresh,
} from '@/lib/supabase/session'

function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { path: '/', maxAge: 0 })
  response.cookies.set(REFRESH_COOKIE, '', { path: '/', maxAge: 0 })
  response.cookies.set(EXPIRES_COOKIE, '', { path: '/', maxAge: 0 })
}

function applySessionHeaders(
  headers: Headers,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
) {
  headers.set(ACCESS_HEADER, accessToken)
  headers.set(REFRESH_HEADER, refreshToken)
  headers.set(EXPIRES_HEADER, String(expiresAt))
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  const expiresAt = Number(request.cookies.get(EXPIRES_COOKIE)?.value ?? 0)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

  if (!refreshToken || (!isApiRoute && !isDashboardRoute && request.nextUrl.pathname !== '/')) {
    return NextResponse.next()
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.next()
  }

  const shouldRefresh =
    !accessToken || !expiresAt || isSessionExpiringSoon(expiresAt)

  if (!shouldRefresh) {
    return NextResponse.next()
  }

  const session = await requestSessionRefresh(refreshToken)

  if (!session) {
    if (isApiRoute) {
      const response = NextResponse.next()
      clearSessionCookies(response)
      return response
    }

    const response = NextResponse.redirect(new URL('/?error=auth', request.url))
    clearSessionCookies(response)
    return response
  }

  const refreshedExpiresAt = getSessionExpiresAt(session)
  const requestHeaders = new Headers(request.headers)
  applySessionHeaders(
    requestHeaders,
    session.access_token,
    session.refresh_token,
    refreshedExpiresAt,
  )

  const nextResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const cookieOptions = {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax' as const,
  }

  nextResponse.cookies.set(ACCESS_COOKIE, session.access_token, cookieOptions)
  nextResponse.cookies.set(REFRESH_COOKIE, session.refresh_token, cookieOptions)
  nextResponse.cookies.set(EXPIRES_COOKIE, String(refreshedExpiresAt), cookieOptions)

  return nextResponse
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/api/:path*'],
}
