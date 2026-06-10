import { NextResponse } from 'next/server'

import { getDashboardAccess } from '@/lib/auth/access'
import { syncExistingApplication } from '@/lib/server/admin-applications'
import { getSupabaseAdminHeaders, getSupabaseRestUrl, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

export const dynamic = 'force-dynamic'

type UpdateApplicationPayload = {
  baseUrl?: string
  apiKey?: string
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '')
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getAuthenticatedUser()

  if (!session?.user) {
    return NextResponse.json({ detail: 'Please sign in again to continue.' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  if (!access.allowed) {
    return NextResponse.json({ detail: 'You do not have permission to edit applications.' }, { status: 403 })
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Application management is not fully configured yet.' },
      { status: 500 },
    )
  }

  const body = (await request.json().catch(() => null)) as UpdateApplicationPayload | null
  const baseUrl = normalizeBaseUrl(body?.baseUrl?.trim() || '')
  const apiKey = body?.apiKey?.trim() || ''

  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    return NextResponse.json({ detail: 'Enter a valid admin API base URL.' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ detail: 'Enter the application API key.' }, { status: 400 })
  }

  try {
    const { id } = await context.params

    const settingsResponse = await fetch(
      `${getSupabaseRestUrl('product_settings')}?select=product_id,settings&product_id=eq.${id}&limit=1`,
      {
        headers: getSupabaseAdminHeaders(),
        cache: 'no-store',
      },
    )

    if (!settingsResponse.ok) {
      throw new Error('We could not load the application connection settings right now.')
    }

    const settingsRows = (await settingsResponse.json()) as Array<{
      product_id: string
      settings?: Record<string, unknown> | null
    }>

    const settingsRow = settingsRows[0]

    if (!settingsRow?.product_id) {
      throw new Error('We could not find that application anymore.')
    }

    const existingSettings = settingsRow.settings ?? {}
    const existingConnection =
      (existingSettings.connection as Record<string, unknown> | undefined) ||
      (existingSettings.admin_api as Record<string, unknown> | undefined) ||
      {}

    const updateResponse = await fetch(
      `${getSupabaseRestUrl('product_settings')}?product_id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          ...getSupabaseAdminHeaders(),
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          admin_api_base_url: baseUrl,
          settings: {
            ...existingSettings,
            connection: {
              ...existingConnection,
              auth_type:
                typeof existingConnection.auth_type === 'string'
                  ? existingConnection.auth_type
                  : 'bearer',
              api_key: apiKey,
              enabled: true,
            },
          },
        }),
      },
    )

    if (!updateResponse.ok) {
      throw new Error('We could not save the new application connection right now.')
    }

    let detail = 'Application connection updated successfully.'

    try {
      await syncExistingApplication(id)
      detail = 'Application connection updated and synced successfully.'
    } catch (error) {
      detail =
        error instanceof Error
          ? toUserFriendlyErrorMessage(error.message)
          : 'The connection was updated, but we could not sync live metrics right now.'
    }

    return NextResponse.json({ success: true, detail })
  } catch (error) {
    return NextResponse.json(
      {
        detail: toUserFriendlyErrorMessage(
          error instanceof Error ? error.message : 'We could not update this application right now.',
        ),
      },
      { status: 502 },
    )
  }
}
