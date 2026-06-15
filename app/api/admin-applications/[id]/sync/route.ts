import { NextResponse } from 'next/server'

import { getDashboardAccess } from '@/lib/auth/access'
import { syncExistingApplication } from '@/lib/server/admin-applications'
import {
  fetchAdminSource,
  getAdminAppSourceByKey,
} from '@/lib/server/kunanyesha-admin'
import { KunanyeshaAdminSummaryResponse } from '@/lib/kunanyesha-admin-types'
import { hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthenticatedUser()

  if (!session?.user) {
    return NextResponse.json({ detail: 'Please sign in again to continue.' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  if (!access.allowed) {
    return NextResponse.json({ detail: 'You do not have permission to sync applications.' }, { status: 403 })
  }

  const { id } = await context.params

  // Env-configured apps use their slug as id (not a UUID). They have no DB row to
  // sync, so we fetch live metrics directly from the connected admin API instead.
  if (!UUID_RE.test(id)) {
    try {
      const source = await getAdminAppSourceByKey(id)

      if (!source || source.key !== id) {
        return NextResponse.json(
          { detail: 'We could not find this application.' },
          { status: 404 },
        )
      }

      const summary = await fetchAdminSource<KunanyeshaAdminSummaryResponse>(source, 'summary')

      return NextResponse.json({
        success: true,
        detail: `${source.label} metrics synced.`,
        metrics: {
          users_total: summary.users_total,
          active_users: summary.app.active_users,
          revenue: summary.app.revenue,
          requests_per_day: summary.app.requests_per_day,
          api_health: summary.app.api_health,
          last_deployment: summary.app.last_deployment ?? null,
        },
      })
    } catch (error) {
      return NextResponse.json(
        {
          detail: toUserFriendlyErrorMessage(
            error instanceof Error ? error.message : 'We could not sync this application right now.',
          ),
        },
        { status: 502 },
      )
    }
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Application management is not fully configured yet.' },
      { status: 500 },
    )
  }

  try {
    await syncExistingApplication(id)
    return NextResponse.json({
      success: true,
      detail: 'Application metrics synced successfully.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        detail: toUserFriendlyErrorMessage(
          error instanceof Error ? error.message : 'We could not sync this application right now.',
        ),
      },
      { status: 502 },
    )
  }
}
