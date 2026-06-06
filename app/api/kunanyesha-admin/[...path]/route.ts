import { NextRequest, NextResponse } from 'next/server'

import { fetchKunanyeshaAdmin, hasKunanyeshaAdminEnv } from '@/lib/server/kunanyesha-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!hasKunanyeshaAdminEnv()) {
    return NextResponse.json(
      { detail: 'Kunanyesha admin API environment variables are missing.' },
      { status: 500 },
    )
  }

  try {
    const { path } = await context.params
    const payload = await fetchKunanyeshaAdmin(path.join('/'), request.nextUrl.searchParams)
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : 'Unable to fetch Kunanyesha admin data.',
      },
      { status: 502 },
    )
  }
}
