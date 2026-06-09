import { NextResponse } from 'next/server'

import { AdminApplicationRecord, AdminApplicationsResponse } from '@/lib/admin-app-types'
import { getDashboardAccess } from '@/lib/auth/access'
import {
  KunanyeshaAdminHealthResponse,
  KunanyeshaAdminSummaryResponse,
} from '@/lib/kunanyesha-admin-types'
import { fetchAdminSource } from '@/lib/server/kunanyesha-admin'
import { getSupabaseAdminHeaders, getSupabaseRestUrl, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

export const dynamic = 'force-dynamic'

type ProductRow = Omit<AdminApplicationRecord, 'connection'> & {
  name?: string | null
  slug?: string | null
}

type ProductSettingsRow = {
  product_id: string
  admin_api_base_url?: string | null
  settings?: Record<string, unknown> | null
}

type CreateApplicationPayload = {
  name?: string
  slug?: string
  description?: string
  icon?: string
  logoUrl?: string
  environment?: string
  baseUrl?: string
  apiKey?: string
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '')
}

function getConnectionSettings(
  settings: Record<string, unknown> | null | undefined,
  adminApiBaseUrl?: string | null,
) {
  const connection =
    (settings?.connection as Record<string, unknown> | undefined) ||
    (settings?.admin_api as Record<string, unknown> | undefined) ||
    {}

  return {
    base_url:
      typeof adminApiBaseUrl === 'string' && adminApiBaseUrl.trim()
        ? adminApiBaseUrl
        : typeof connection.base_url === 'string'
          ? connection.base_url
          : typeof connection.baseUrl === 'string'
            ? connection.baseUrl
            : null,
    auth_type:
      typeof connection.auth_type === 'string'
        ? connection.auth_type
        : typeof connection.authType === 'string'
          ? connection.authType
          : 'bearer',
    api_key:
      typeof connection.api_key === 'string'
        ? connection.api_key
        : typeof connection.apiKey === 'string'
          ? connection.apiKey
          : null,
    enabled:
      typeof connection.enabled === 'boolean'
        ? connection.enabled
        : true,
    health_path:
      typeof connection.health_path === 'string'
        ? connection.health_path
        : '/health',
  }
}

async function getCurrentOrganizationId(userId: string) {
  const membershipsResponse = await fetch(
    `${getSupabaseRestUrl('organization_members')}?select=organization_id&user_id=eq.${userId}&status=eq.active&limit=1`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (!membershipsResponse.ok) {
    return null
  }

  const memberships = (await membershipsResponse.json()) as Array<{ organization_id?: string | null }>
  return memberships[0]?.organization_id ?? null
}

async function syncApplicationSnapshot(params: {
  productId: string
  slug: string
  name: string
  baseUrl: string
  apiKey: string
}) {
  const source = {
    id: params.productId,
    key: params.slug,
    label: params.name,
    baseUrl: params.baseUrl,
    apiKey: params.apiKey,
    icon: '📦',
  }

  const [summary, health] = await Promise.all([
    fetchAdminSource<KunanyeshaAdminSummaryResponse>(source, 'summary'),
    fetchAdminSource<KunanyeshaAdminHealthResponse>(source, 'health').catch(() => null),
  ])

  const productUpdateResponse = await fetch(`${getSupabaseRestUrl('products')}?id=eq.${params.productId}`, {
    method: 'PATCH',
    headers: {
      ...getSupabaseAdminHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      status: health?.status === 'degraded' ? 'degraded' : summary.app.status || 'operational',
      environment: summary.app.environment || 'production',
      api_health: summary.app.api_health ?? null,
      uptime: null,
      active_users: summary.app.active_users ?? 0,
      total_users: summary.users_total ?? summary.app.users ?? 0,
      requests_per_day: summary.app.requests_per_day ?? 0,
      monthly_revenue: summary.completed_payments_total ?? summary.app.revenue ?? 0,
      last_deployment_at: summary.app.last_deployment ?? null,
      updated_at: new Date().toISOString(),
    }),
  })

  if (!productUpdateResponse.ok) {
    throw new Error('The application was connected, but we could not save its live metrics yet.')
  }
}

async function fetchApplications(): Promise<AdminApplicationsResponse> {
  const productsResponse = await fetch(
    `${getSupabaseRestUrl('products')}?select=id,organization_id,name,slug,description,icon,logo_url,status,environment,api_health,uptime,active_users,total_users,requests_per_day,monthly_revenue,last_deployment_at,created_by,created_at,updated_at&order=created_at.desc`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (!productsResponse.ok) {
    throw new Error('We could not load the applications right now.')
  }

  const products = (await productsResponse.json()) as ProductRow[]

  if (!products.length) {
    return { total: 0, items: [] }
  }

  const ids = products.map((product) => product.id)
  const settingsResponse = await fetch(
    `${getSupabaseRestUrl('product_settings')}?select=product_id,admin_api_base_url,settings&product_id=in.(${ids.join(',')})`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (!settingsResponse.ok) {
    throw new Error('We could not load the application settings right now.')
  }

  const settingsRows = (await settingsResponse.json()) as ProductSettingsRow[]
  const settingsById = new Map(settingsRows.map((row) => [row.product_id, row]))

  const items: AdminApplicationRecord[] = products.map((product) => {
    const settingsRow = settingsById.get(product.id)
    const connection = getConnectionSettings(
      settingsRow?.settings,
      settingsRow?.admin_api_base_url ?? null,
    )

    return {
      id: product.id,
      organization_id: product.organization_id ?? null,
      name: product.name ?? 'Untitled App',
      slug: product.slug ?? '',
      description: product.description ?? null,
      icon: product.icon ?? '📦',
      logo_url: product.logo_url ?? null,
      status: product.status ?? 'operational',
      environment: product.environment ?? 'production',
      api_health: product.api_health ?? null,
      uptime: product.uptime ?? null,
      active_users: product.active_users ?? 0,
      total_users: product.total_users ?? 0,
      requests_per_day: product.requests_per_day ?? 0,
      monthly_revenue: product.monthly_revenue ?? 0,
      last_deployment_at: product.last_deployment_at ?? null,
      created_by: product.created_by ?? null,
      created_at: product.created_at ?? null,
      updated_at: product.updated_at ?? null,
      connection,
    }
  })

  return {
    total: items.length,
    items,
  }
}

export async function GET() {
  const session = await getAuthenticatedUser()

  if (!session?.user) {
    return NextResponse.json({ detail: 'Please sign in again to continue.' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  if (!access.allowed) {
    return NextResponse.json({ detail: 'You do not have permission to manage applications.' }, { status: 403 })
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Application management is not fully configured yet.' },
      { status: 500 },
    )
  }

  try {
    const payload = await fetchApplications()
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      {
        detail: toUserFriendlyErrorMessage(
          error instanceof Error ? error.message : 'We could not load the applications right now.',
        ),
      },
      { status: 502 },
    )
  }
}

export async function POST(request: Request) {
  const session = await getAuthenticatedUser()

  if (!session?.user) {
    return NextResponse.json({ detail: 'Please sign in again to continue.' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  if (!access.allowed) {
    return NextResponse.json({ detail: 'You do not have permission to add applications.' }, { status: 403 })
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Application management is not fully configured yet.' },
      { status: 500 },
    )
  }

  const body = (await request.json().catch(() => null)) as CreateApplicationPayload | null
  const name = body?.name?.trim()
  const slug = normalizeSlug(body?.slug || body?.name || '')
  const description = body?.description?.trim() || null
  const icon = body?.icon?.trim() || '📦'
  const logoUrl = body?.logoUrl?.trim() || null
  const environment = body?.environment?.trim().toLowerCase() === 'staging' ? 'staging' : 'production'
  const baseUrl = normalizeBaseUrl(body?.baseUrl?.trim() || '')
  const apiKey = body?.apiKey?.trim() || ''

  if (!name) {
    return NextResponse.json({ detail: 'Enter the application name.' }, { status: 400 })
  }

  if (!slug) {
    return NextResponse.json({ detail: 'Enter a valid application slug.' }, { status: 400 })
  }

  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    return NextResponse.json({ detail: 'Enter a valid admin API base URL.' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ detail: 'Enter the application API key.' }, { status: 400 })
  }

  const organizationId = await getCurrentOrganizationId(session.user.id)

  if (!organizationId) {
    return NextResponse.json(
      { detail: 'Your account is not linked to an active team yet.' },
      { status: 400 },
    )
  }

  const existingResponse = await fetch(
    `${getSupabaseRestUrl('products')}?select=id&slug=eq.${slug}&limit=1`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (!existingResponse.ok) {
    return NextResponse.json(
      { detail: 'We could not verify whether this application already exists.' },
      { status: 502 },
    )
  }

  const existing = (await existingResponse.json()) as Array<{ id: string }>
  if (existing.length > 0) {
    return NextResponse.json(
      { detail: 'An application with this slug already exists.' },
      { status: 409 },
    )
  }

  const productInsertResponse = await fetch(getSupabaseRestUrl('products'), {
    method: 'POST',
    headers: {
      ...getSupabaseAdminHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        organization_id: organizationId,
        name,
        slug,
        description,
        icon,
        logo_url: logoUrl,
        status: 'operational',
        environment,
        created_by: session.user.id,
      },
    ]),
  })

  if (!productInsertResponse.ok) {
    return NextResponse.json(
      { detail: 'We could not create the application record right now.' },
      { status: 502 },
    )
  }

  const [product] = (await productInsertResponse.json()) as Array<{ id: string }>

  const settingsResponse = await fetch(getSupabaseRestUrl('product_settings'), {
    method: 'POST',
    headers: {
      ...getSupabaseAdminHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        product_id: product.id,
        admin_api_base_url: baseUrl,
        settings: {
          connection: {
            auth_type: 'bearer',
            api_key: apiKey,
            enabled: true,
          },
          health: {
            path: '/health',
          },
          sync: {
            enabled: true,
          },
        },
      },
    ]),
  })

  if (!settingsResponse.ok) {
    return NextResponse.json(
      {
        detail:
          'The application was created, but we could not finish saving the connection settings.',
      },
      { status: 502 },
    )
  }

  let detail = `${name} has been added successfully.`

  try {
    await syncApplicationSnapshot({
      productId: product.id,
      slug,
      name,
      baseUrl,
      apiKey,
    })
    detail = `${name} has been added and synced successfully.`
  } catch (error) {
    detail =
      error instanceof Error
        ? toUserFriendlyErrorMessage(error.message)
        : 'The application was added, but we could not sync its live metrics right now.'
  }

  return NextResponse.json({
    success: true,
    detail,
    id: product.id,
  })
}
