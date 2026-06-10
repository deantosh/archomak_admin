import { NextResponse } from 'next/server'

import { isAllowedOfficialEmail, type OfficialVerificationStatus } from '@/lib/official-verification'
import { getSupabaseAdminHeaders, getSupabaseRestUrl, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type ProfileVerificationRow = {
  id: string
  signoff_email?: string | null
  official_verification_status?: OfficialVerificationStatus | null
  official_email_verified_at?: string | null
  report_access_enabled?: boolean | null
  official_verified_by?: string | null
}

type VerificationRecord = {
  id: string
  email: string
  status: string
  expires_at: string
  verified_at?: string | null
  created_at: string
}

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

export async function GET() {
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
    `${getSupabaseRestUrl('profiles')}?id=eq.${session.user.id}&select=id,signoff_email,official_verification_status,official_email_verified_at,report_access_enabled,official_verified_by&limit=1`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (!profileResponse.ok) {
    const payload = await readJson(profileResponse)
    return NextResponse.json(
      {
        detail: readErrorMessage(payload, 'We could not load your verification status right now.'),
      },
      { status: 502 },
    )
  }

  const profiles = (await profileResponse.json()) as ProfileVerificationRow[]
  const profile = profiles[0] ?? null

  const verificationResponse = await fetch(
    `${getSupabaseRestUrl('profile_verifications')}?profile_id=eq.${session.user.id}&select=id,email,status,expires_at,verified_at,created_at&order=created_at.desc&limit=1`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  const verificationRows = verificationResponse.ok
    ? ((await verificationResponse.json()) as VerificationRecord[])
    : []

  return NextResponse.json({
    profile,
    latest_request: verificationRows[0] ?? null,
    allowed_domains: process.env.NEXT_PUBLIC_OFFICIAL_EMAIL_DOMAINS || '',
  })
}

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as { workEmail?: string } | null
  const workEmail = body?.workEmail?.trim().toLowerCase() || session.user.email?.trim().toLowerCase() || ''

  if (!workEmail || !workEmail.includes('@')) {
    return NextResponse.json({ detail: 'Enter a valid work email address.' }, { status: 400 })
  }

  if (!isAllowedOfficialEmail(workEmail)) {
    return NextResponse.json(
      { detail: 'Use a work email from an approved organization domain.' },
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
        signoff_email: workEmail,
        official_verification_status: 'pending',
        official_email_verified_at: null,
        official_verified_by: null,
        report_access_enabled: false,
        updated_at: new Date().toISOString(),
      }),
    },
  )

  if (!profileResponse.ok) {
    const payload = await readJson(profileResponse)
    return NextResponse.json(
      {
        detail: readErrorMessage(
          payload,
          'We could not start your official verification request right now.',
        ),
      },
      { status: 502 },
    )
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)

  const verificationResponse = await fetch(getSupabaseRestUrl('profile_verifications'), {
    method: 'POST',
    headers: {
      ...getSupabaseAdminHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      profile_id: session.user.id,
      email: workEmail,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  })

  if (!verificationResponse.ok) {
    const payload = await readJson(verificationResponse)
    return NextResponse.json(
      {
        detail: readErrorMessage(
          payload,
          'We could not save your verification request right now.',
        ),
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    success: true,
    detail: 'Verification request saved. Check your work email to confirm the address.',
    workEmail,
  })
}
