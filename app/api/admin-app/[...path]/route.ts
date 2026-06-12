import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { ADMIN_APP_COOKIE_NAME } from '@/lib/admin-app-selection'
import { fetchAdminSource, getAdminAppSourceByKey } from '@/lib/server/kunanyesha-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const cookieStore = await cookies()
  const appKey = cookieStore.get(ADMIN_APP_COOKIE_NAME)?.value
  const source = await getAdminAppSourceByKey(appKey)

  if (!source) {
    return NextResponse.json(
      { detail: 'The selected application connection is incomplete.' },
      { status: 500 },
    )
  }

  try {
    const { path } = await context.params
    const payload = await fetchAdminSource(source, path.join('/'), request.nextUrl.searchParams)
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : 'We could not load the selected application data right now.',
      },
      { status: 502 },
    )
  }
}
