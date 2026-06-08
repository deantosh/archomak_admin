import { NextResponse } from 'next/server'

import { fetchPortfolioOverview, hasPortfolioSources } from '@/lib/server/admin-portfolio'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!hasPortfolioSources()) {
    return NextResponse.json(
      { detail: 'No application connections are configured yet.' },
      { status: 500 },
    )
  }

  try {
    const payload = await fetchPortfolioOverview()
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
