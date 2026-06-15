import { NextResponse } from 'next/server'

import { getDashboardAccess } from '@/lib/auth/access'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthenticatedUser()

  if (!session?.user) {
    return NextResponse.json({ detail: 'Please sign in again to continue.' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  const allowedRoles = (
    process.env.SUPABASE_ALLOWED_ADMIN_ROLES?.split(',') ?? [
      'admin',
      'administrator',
      'staff',
      'owner',
      'super_admin',
      'superadmin',
      'operations',
      'ops',
    ]
  )
    .map((role) => role.trim())
    .filter(Boolean)

  const accessTable = process.env.SUPABASE_ACCESS_TABLE ?? 'organization_members'

  return NextResponse.json({
    email: session.user.email ?? null,
    displayName: access.displayName,
    role: access.roleLabel ?? null,
    allowedRoles,
    accessTable,
  })
}
