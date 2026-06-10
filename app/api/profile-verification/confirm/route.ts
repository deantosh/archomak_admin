import { NextResponse } from 'next/server'

import { getSupabaseAdminHeaders, getSupabaseRestUrl, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function readErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const detail = 'detail' in payload ? (payload as { detail?: unknown }).detail : null

  return typeof detail === 'string' && detail.trim() ? detail : fallback
}

async function readJson(response: Response) {
  const text = await response.text().catch(() => '')

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}

export async function POST() {
  const session = await getAuthenticatedUser()

  if (!session?.user) {
    return NextResponse.json({ detail: 'Please sign in again to continue.' }, { status: 401 })
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Official verification is not fully configured yet.' },
      { status: 500 },
    )
  }

  const profileResponse = await fetch(
    `${getSupabaseRestUrl('profiles')}?id=eq.${session.user.id}&select=id,signoff_email,official_verification_status&limit=1`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (!profileResponse.ok) {
    const payload = await readJson(profileResponse)
    return NextResponse.json(
      {
        detail: readErrorMessage(payload, 'We could not verify your official email right now.'),
      },
      { status: 502 },
    )
  }

  const profiles = (await profileResponse.json()) as Array<{
    id: string
    signoff_email?: string | null
    official_verification_status?: string | null
  }>
  const profile = profiles[0]

  if (!profile?.signoff_email) {
    return NextResponse.json(
      { detail: 'Please request official verification before confirming your email.' },
      { status: 400 },
    )
  }

  const currentEmail = (session.user.email || '').trim().toLowerCase()
  const signoffEmail = profile.signoff_email.trim().toLowerCase()

  if (currentEmail !== signoffEmail) {
    return NextResponse.json(
      { detail: 'Please confirm the work email before finishing verification.' },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()

  const updateResponse = await fetch(
    `${getSupabaseRestUrl('profiles')}?id=eq.${session.user.id}`,
    {
      method: 'PATCH',
      headers: {
        ...getSupabaseAdminHeaders(),
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        official_verification_status: 'verified',
        official_email_verified_at: now,
        report_access_enabled: true,
        updated_at: now,
      }),
    },
  )

  if (!updateResponse.ok) {
    const payload = await readJson(updateResponse)
    return NextResponse.json(
      {
        detail: readErrorMessage(
          payload,
          'We could not finish verifying your official email right now.',
        ),
      },
      { status: 502 },
    )
  }

  const verificationRowsResponse = await fetch(
    `${getSupabaseRestUrl('profile_verifications')}?profile_id=eq.${session.user.id}&email=eq.${encodeURIComponent(signoffEmail)}&status=eq.pending&order=created_at.desc&limit=1`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (verificationRowsResponse.ok) {
    const rows = (await verificationRowsResponse.json()) as Array<{ id: string }>
    const row = rows[0]

    if (row?.id) {
      await fetch(`${getSupabaseRestUrl('profile_verifications')}?id=eq.${row.id}`, {
        method: 'PATCH',
        headers: {
          ...getSupabaseAdminHeaders(),
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          status: 'verified',
          verified_at: now,
          updated_at: now,
        }),
      })
    }
  }

  return NextResponse.json({
    success: true,
    detail: 'Your work email is verified. Official report access is now available.',
  })
}
