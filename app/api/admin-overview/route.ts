import { NextResponse } from 'next/server'

import { fetchPortfolioOverview, hasPortfolioSources } from '@/lib/server/admin-portfolio'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!hasPortfolioSources()) {
    return NextResponse.json(
      { detail: 'No connected admin application sources are configured.' },
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
          error instanceof Error ? error.message : 'Unable to fetch connected application data.',
      },
      { status: 502 },
    )
  }
}
