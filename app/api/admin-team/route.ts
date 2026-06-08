import { NextResponse } from 'next/server'

import { getDashboardAccess } from '@/lib/auth/access'
import { AdminTeamMember } from '@/lib/admin-team-types'
import { getSupabaseAdminHeaders, getSupabaseAuthAdminUrl, getSupabaseRestUrl, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getSupabaseEnv } from '@/lib/supabase/config'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export async function GET() {
  const session = await getAuthenticatedUser()

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  if (!access.allowed) {
    return NextResponse.json({ detail: 'Access denied' }, { status: 403 })
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()

  const membershipsUrl = new URL(`${supabaseUrl}/rest/v1/organization_members`)
  membershipsUrl.searchParams.set('select', 'organization_id')
  membershipsUrl.searchParams.set('user_id', `eq.${session.user.id}`)
  membershipsUrl.searchParams.set('status', 'eq.active')

  const baseHeaders = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${session.accessToken}`,
  }

  const membershipsResponse = await fetch(membershipsUrl.toString(), {
    headers: baseHeaders,
    cache: 'no-store',
  })

  if (!membershipsResponse.ok) {
    return NextResponse.json(
      { detail: 'Unable to load organization memberships.' },
      { status: 502 },
    )
  }

  const memberships = (await membershipsResponse.json()) as Array<{ organization_id: string }>
  const organizationIds = Array.from(
    new Set(memberships.map((item) => item.organization_id).filter(Boolean)),
  )

  if (organizationIds.length === 0) {
    return NextResponse.json({ total: 0, items: [] })
  }

  const membersUrl = new URL(`${supabaseUrl}/rest/v1/organization_members`)
  membersUrl.searchParams.set(
    'select',
    'id,user_id,organization_id,role,status,joined_at,created_at,updated_at,profiles(full_name,email,avatar_url),organizations(name)',
  )
  membersUrl.searchParams.set('organization_id', `in.(${organizationIds.join(',')})`)
  membersUrl.searchParams.set('order', 'created_at.desc')

  const membersResponse = await fetch(membersUrl.toString(), {
    headers: baseHeaders,
    cache: 'no-store',
  })

  if (!membersResponse.ok) {
    return NextResponse.json(
      { detail: 'Unable to load organization team members.' },
      { status: 502 },
    )
  }

  const rows = (await membersResponse.json()) as Array<
    Record<string, unknown> & {
      profiles?: { full_name?: string | null; email?: string | null; avatar_url?: string | null } | null
      organizations?: { name?: string | null } | null
    }
  >

  const items: AdminTeamMember[] = rows.map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    organization_id: String(row.organization_id),
    organization_name: row.organizations?.name ?? null,
    full_name: row.profiles?.full_name ?? null,
    email: row.profiles?.email ?? null,
    avatar_url: row.profiles?.avatar_url ?? null,
    role: typeof row.role === 'string' ? toTitleCase(row.role) : 'Member',
    status: typeof row.status === 'string' ? row.status : 'active',
    joined_at: typeof row.joined_at === 'string' ? row.joined_at : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : null,
  }))

  return NextResponse.json({
    total: items.length,
    items,
  })
}

type InvitePayload = {
  email?: string
  fullName?: string
  role?: string
}

const ALLOWED_ROLES = ['owner', 'admin', 'manager', 'developer', 'analyst', 'viewer']

export async function POST(request: Request) {
  const session = await getAuthenticatedUser()

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  if (!access.allowed) {
    return NextResponse.json({ detail: 'Access denied' }, { status: 403 })
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Missing SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 },
    )
  }

  const body = (await request.json().catch(() => null)) as InvitePayload | null
  const email = body?.email?.trim().toLowerCase()
  const fullName = body?.fullName?.trim() || null
  const requestedRole = body?.role?.trim().toLowerCase() || 'viewer'

  if (!email || !email.includes('@')) {
    return NextResponse.json({ detail: 'A valid email address is required.' }, { status: 400 })
  }

  if (!ALLOWED_ROLES.includes(requestedRole)) {
    return NextResponse.json({ detail: 'Invalid team role selected.' }, { status: 400 })
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  const membershipsUrl = new URL(`${supabaseUrl}/rest/v1/organization_members`)
  membershipsUrl.searchParams.set('select', 'organization_id,organizations(name)')
  membershipsUrl.searchParams.set('user_id', `eq.${session.user.id}`)
  membershipsUrl.searchParams.set('status', 'eq.active')
  membershipsUrl.searchParams.set('limit', '1')

  const membershipsResponse = await fetch(membershipsUrl.toString(), {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: 'no-store',
  })

  if (!membershipsResponse.ok) {
    return NextResponse.json(
      { detail: 'Unable to resolve your organization membership.' },
      { status: 502 },
    )
  }

  const memberships = (await membershipsResponse.json()) as Array<{
    organization_id: string
    organizations?: { name?: string | null } | null
  }>
  const membership = memberships[0]

  if (!membership?.organization_id) {
    return NextResponse.json(
      { detail: 'No active organization membership found for the current admin.' },
      { status: 400 },
    )
  }

  const redirectTo = `${new URL(request.url).origin}/accept-invite`
  const inviteResponse = await fetch(getSupabaseAuthAdminUrl('/invite'), {
    method: 'POST',
    headers: getSupabaseAdminHeaders(),
    body: JSON.stringify({
      email,
      data: {
        full_name: fullName,
        role: requestedRole,
        organization_id: membership.organization_id,
        organization_name: membership.organizations?.name ?? 'Archomak',
      },
      redirectTo,
    }),
  })

  const invitePayload = (await inviteResponse.json().catch(() => null)) as
    | {
        user?: {
          id?: string
          email?: string
        }
        msg?: string
        error_description?: string
      }
    | null

  if (!inviteResponse.ok || !invitePayload?.user?.id) {
    return NextResponse.json(
      {
        detail:
          invitePayload?.error_description ||
          invitePayload?.msg ||
          'Unable to send the invitation email.',
      },
      { status: 502 },
    )
  }

  const profileResponse = await fetch(
    `${getSupabaseRestUrl('profiles')}?on_conflict=id`,
    {
      method: 'POST',
      headers: {
        ...getSupabaseAdminHeaders(),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([
        {
          id: invitePayload.user.id,
          email,
          full_name: fullName,
          status: 'active',
        },
      ]),
    },
  )

  if (!profileResponse.ok) {
    return NextResponse.json(
      { detail: 'Invitation sent, but the staff profile could not be prepared.' },
      { status: 502 },
    )
  }

  const membershipUpsertResponse = await fetch(
    `${getSupabaseRestUrl('organization_members')}?on_conflict=organization_id,user_id`,
    {
      method: 'POST',
      headers: {
        ...getSupabaseAdminHeaders(),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([
        {
          organization_id: membership.organization_id,
          user_id: invitePayload.user.id,
          role: requestedRole,
          status: 'invited',
          invited_by: session.user.id,
        },
      ]),
    },
  )

  if (!membershipUpsertResponse.ok) {
    return NextResponse.json(
      { detail: 'Invitation sent, but the organization membership could not be saved.' },
      { status: 502 },
    )
  }

  return NextResponse.json({
    success: true,
    detail: `Invitation sent to ${email}.`,
  })
}
