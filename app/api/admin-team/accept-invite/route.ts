import { NextResponse } from 'next/server'

import { getSupabaseAdminHeaders, getSupabaseRestUrl, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/server'

type AcceptInvitePayload = {
  fullName?: string
}

export async function POST(request: Request) {
  const session = await getAuthenticatedUser()

  if (!session?.user) {
    return NextResponse.json({ detail: 'Please open the latest invitation link and try again.' }, { status: 401 })
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Invitations are not fully configured yet.' },
      { status: 500 },
    )
  }

  const body = (await request.json().catch(() => null)) as AcceptInvitePayload | null
  const fullName = body?.fullName?.trim() || null

  const membershipResponse = await fetch(
    `${getSupabaseRestUrl('organization_members')}?user_id=eq.${session.user.id}&status=eq.invited&select=id&limit=1`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (!membershipResponse.ok) {
    return NextResponse.json(
      { detail: 'We could not verify your invitation right now.' },
      { status: 502 },
    )
  }

  const memberships = (await membershipResponse.json()) as Array<{ id: string }>
  const membership = memberships[0]

  if (!membership?.id) {
    return NextResponse.json(
      { detail: 'This invitation is no longer valid. Please request a new one.' },
      { status: 400 },
    )
  }

  const profileResponse = await fetch(
    `${getSupabaseRestUrl('profiles')}?id=eq.${session.user.id}`,
    {
      method: 'PATCH',
      headers: {
        ...getSupabaseAdminHeaders(),
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        full_name: fullName,
        email: session.user.email ?? null,
        status: 'active',
        last_active_at: new Date().toISOString(),
      }),
    },
  )

  if (!profileResponse.ok) {
    return NextResponse.json(
      { detail: 'We could not finish setting up your staff profile right now.' },
      { status: 502 },
    )
  }

  const activationResponse = await fetch(
    `${getSupabaseRestUrl('organization_members')}?id=eq.${membership.id}`,
    {
      method: 'PATCH',
      headers: {
        ...getSupabaseAdminHeaders(),
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        status: 'active',
        joined_at: new Date().toISOString(),
      }),
    },
  )

  if (!activationResponse.ok) {
    return NextResponse.json(
      { detail: 'We could not activate your team access right now.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ success: true })
}
