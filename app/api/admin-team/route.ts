import { NextResponse } from 'next/server'

import { getDashboardAccess } from '@/lib/auth/access'
import { AdminTeamMember } from '@/lib/admin-team-types'
import { getSupabaseAdminHeaders, getSupabaseAuthAdminUrl, getSupabaseRestUrl, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getSupabaseEnv } from '@/lib/supabase/config'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

export const dynamic = 'force-dynamic'

async function readErrorPayload(response: Response) {
  const text = await response.text().catch(() => '')

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return { raw: text }
  }
}

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
    return NextResponse.json({ detail: 'Please sign in again to continue.' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  if (!access.allowed) {
    return NextResponse.json({ detail: 'You do not have permission to view team members.' }, { status: 403 })
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  const readHeaders = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${session.accessToken}`,
  }

  const membershipsUrl = new URL(`${supabaseUrl}/rest/v1/organization_members`)
  membershipsUrl.searchParams.set('select', 'organization_id')
  membershipsUrl.searchParams.set('user_id', `eq.${session.user.id}`)
  membershipsUrl.searchParams.set('status', 'eq.active')

  const membershipsResponse = await fetch(membershipsUrl.toString(), {
    headers: readHeaders,
    cache: 'no-store',
  })

  if (!membershipsResponse.ok) {
    const errorPayload = await readErrorPayload(membershipsResponse)
    return NextResponse.json(
      {
        detail: 'We could not load your team information right now.',
        debug: {
          step: 'load-active-membership',
          status: membershipsResponse.status,
          authenticated_user_id: session.user.id,
          response: errorPayload,
        },
      },
      { status: 502 },
    )
  }

  const memberships = (await membershipsResponse.json()) as Array<{ organization_id: string }>
  const organizationIds = Array.from(
    new Set(memberships.map((item) => item.organization_id).filter(Boolean)),
  )

  if (organizationIds.length === 0) {
    return NextResponse.json(
      {
        detail:
          'Your account can access the dashboard, but no active team membership was found for loading team members.',
      },
      { status: 409 },
    )
  }

  const membersUrl = new URL(`${supabaseUrl}/rest/v1/organization_members`)
  membersUrl.searchParams.set(
    'select',
    'id,user_id,organization_id,role,status,joined_at,created_at,updated_at,profiles!organization_members_user_id_fkey(full_name,email,avatar_url),organizations(name)',
  )
  membersUrl.searchParams.set('organization_id', `in.(${organizationIds.join(',')})`)
  membersUrl.searchParams.set('order', 'created_at.desc')

  const membersResponse = await fetch(membersUrl.toString(), {
    headers: readHeaders,
    cache: 'no-store',
  })

  if (!membersResponse.ok) {
    const errorPayload = await readErrorPayload(membersResponse)
    return NextResponse.json(
      {
        detail: 'We could not load the team members right now.',
        debug: {
          step: 'load-team-members',
          status: membersResponse.status,
          authenticated_user_id: session.user.id,
          matched_organization_ids: organizationIds,
          response: errorPayload,
        },
      },
      { status: 502 },
    )
  }

  const rows = (await membersResponse.json()) as Array<
    Record<string, unknown> & {
      profiles?: { full_name?: string | null; email?: string | null; avatar_url?: string | null } | null
      organizations?: { name?: string | null } | null
    }
  >

  if (rows.length === 0) {
    return NextResponse.json(
      {
        detail:
          'No team members were returned for your active organization. This usually means the membership query is being restricted by database access rules.',
        debug: {
          authenticated_user_id: session.user.id,
          matched_organization_ids: organizationIds,
          active_membership_rows: memberships.length,
        },
      },
      { status: 409 },
    )
  }

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
    return NextResponse.json({ detail: 'Please sign in again to continue.' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  if (!access.allowed) {
    return NextResponse.json({ detail: 'You do not have permission to invite team members.' }, { status: 403 })
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Invitations are not fully configured yet.' },
      { status: 500 },
    )
  }

  const body = (await request.json().catch(() => null)) as InvitePayload | null
  const email = body?.email?.trim().toLowerCase()
  const fullName = body?.fullName?.trim() || null
  const requestedRole = body?.role?.trim().toLowerCase() || 'viewer'

  if (!email || !email.includes('@')) {
    return NextResponse.json({ detail: 'Enter a valid work email address.' }, { status: 400 })
  }

  if (!ALLOWED_ROLES.includes(requestedRole)) {
    return NextResponse.json({ detail: 'Choose a valid team role.' }, { status: 400 })
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
    const errorPayload = await readErrorPayload(membershipsResponse)
    return NextResponse.json(
      {
        detail: 'We could not verify your team membership right now.',
        debug: {
          step: 'verify-inviter-membership',
          status: membershipsResponse.status,
          authenticated_user_id: session.user.id,
          response: errorPayload,
        },
      },
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
      { detail: 'Your account is not linked to an active team yet.' },
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
        detail: toUserFriendlyErrorMessage(
          invitePayload?.error_description ||
            invitePayload?.msg ||
            'We could not send the invitation right now.',
        ),
        debug: {
          step: 'create-supabase-invite',
          status: inviteResponse.status,
          invited_email: email,
          organization_id: membership.organization_id,
          response: invitePayload,
        },
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
    const errorPayload = await readErrorPayload(profileResponse)
    return NextResponse.json(
      {
        detail: 'The invitation was sent, but we could not finish preparing the staff account.',
        debug: {
          step: 'upsert-profile',
          status: profileResponse.status,
          invited_user_id: invitePayload.user.id,
          invited_email: email,
          response: errorPayload,
        },
      },
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
    const errorPayload = await readErrorPayload(membershipUpsertResponse)
    return NextResponse.json(
      {
        detail: 'The invitation was sent, but we could not finish linking the team membership.',
        debug: {
          step: 'upsert-team-membership',
          status: membershipUpsertResponse.status,
          invited_user_id: invitePayload.user.id,
          organization_id: membership.organization_id,
          response: errorPayload,
        },
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    success: true,
    detail: `Invitation sent to ${email}.`,
  })
}
