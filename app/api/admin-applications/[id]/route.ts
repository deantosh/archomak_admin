import { NextResponse } from 'next/server'

import { getDashboardAccess } from '@/lib/auth/access'
import { getSupabaseAdminHeaders, getSupabaseRestUrl, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

export const dynamic = 'force-dynamic'

type UpdatePayload = {
  name?: string
  description?: string | null
  icon?: string
  logoUrl?: string | null
  environment?: string
  baseUrl?: string
  apiKey?: string
  enabled?: boolean
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
    return NextResponse.json({ detail: 'Application management is not fully configured yet.' }, { status: 500 })
  }

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as UpdatePayload | null

  const existingResponse = await fetch(
    `${getSupabaseRestUrl('products')}?select=id&id=eq.${id}&limit=1`,
    { headers: getSupabaseAdminHeaders(), cache: 'no-store' },
  )

  if (!existingResponse.ok) {
    return NextResponse.json({ detail: 'We could not verify this application.' }, { status: 502 })
  }

  const existing = (await existingResponse.json()) as Array<{ id: string }>
  if (!existing[0]) {
    return NextResponse.json({ detail: 'Application not found.' }, { status: 404 })
  }

  const productPatch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body?.name?.trim()) productPatch.name = body.name.trim()
  if (body?.description !== undefined) productPatch.description = body.description?.trim() || null
  if (body?.icon?.trim()) productPatch.icon = body.icon.trim()
  if (body?.logoUrl !== undefined) productPatch.logo_url = body.logoUrl || null
  if (body?.environment) productPatch.environment = body.environment === 'staging' ? 'staging' : 'production'

  const productUpdateResponse = await fetch(
    `${getSupabaseRestUrl('products')}?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: { ...getSupabaseAdminHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify(productPatch),
    },
  )

  if (!productUpdateResponse.ok) {
    return NextResponse.json(
      { detail: toUserFriendlyErrorMessage('We could not update the application right now.') },
      { status: 502 },
    )
  }

  if (body?.baseUrl || body?.apiKey || body?.enabled !== undefined) {
    const settingsResponse = await fetch(
      `${getSupabaseRestUrl('product_settings')}?select=product_id,settings&product_id=eq.${id}&limit=1`,
      { headers: getSupabaseAdminHeaders(), cache: 'no-store' },
    )

    if (settingsResponse.ok) {
      const settingsRows = (await settingsResponse.json()) as Array<{
        product_id: string
        settings?: Record<string, unknown> | null
      }>
      const existingSettings = settingsRows[0]?.settings ?? {}
      const existingConnection = (existingSettings.connection as Record<string, unknown>) ?? {}

      const updatedConnection: Record<string, unknown> = {
        ...existingConnection,
        auth_type: 'bearer',
      }
      if (body?.enabled !== undefined) updatedConnection.enabled = body.enabled
      if (body?.apiKey?.trim()) updatedConnection.api_key = body.apiKey.trim()
      if (body?.baseUrl?.trim()) updatedConnection.base_url = body.baseUrl.trim().replace(/\/+$/, '')

      const settingsPatch: Record<string, unknown> = {
        settings: { ...existingSettings, connection: updatedConnection },
      }
      if (body?.baseUrl?.trim()) settingsPatch.admin_api_base_url = body.baseUrl.trim().replace(/\/+$/, '')

      await fetch(
        `${getSupabaseRestUrl('product_settings')}?product_id=eq.${id}`,
        {
          method: 'PATCH',
          headers: { ...getSupabaseAdminHeaders(), Prefer: 'return=minimal' },
          body: JSON.stringify(settingsPatch),
        },
      )
    }
  }

  return NextResponse.json({ success: true, detail: 'Application updated successfully.' })
}
