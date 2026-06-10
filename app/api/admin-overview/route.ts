import { NextRequest, NextResponse } from 'next/server'

import { fetchPortfolioOverview } from '@/lib/server/admin-portfolio'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const appKey = request.nextUrl.searchParams.get('app')
    const payload = await fetchPortfolioOverview(appKey && appKey !== 'all' ? appKey : null)
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : 'We could not load the connected application data right now.',
      },
      { status: 502 },
    )
  }
}
