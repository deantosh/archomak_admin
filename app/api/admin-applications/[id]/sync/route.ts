import { NextResponse } from 'next/server'

import { getDashboardAccess } from '@/lib/auth/access'
import { syncExistingApplication } from '@/lib/server/admin-applications'
import { hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

export const dynamic = 'force-dynamic'

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

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Application management is not fully configured yet.' },
      { status: 500 },
    )
  }

  try {
    const { id } = await context.params
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
