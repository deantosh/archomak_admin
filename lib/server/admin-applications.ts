import 'server-only'

import {
  KunanyeshaAdminHealthResponse,
  KunanyeshaAdminSummaryResponse,
} from '@/lib/kunanyesha-admin-types'
import { fetchAdminSource } from '@/lib/server/kunanyesha-admin'
import { getSupabaseAdminHeaders, getSupabaseRestUrl } from '@/lib/supabase/admin'

type ProductSettingsRow = {
  product_id: string
  admin_api_base_url?: string | null
  settings?: Record<string, unknown> | null
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
    baseUrl:
      typeof adminApiBaseUrl === 'string' && adminApiBaseUrl.trim()
        ? adminApiBaseUrl
        : typeof connection.base_url === 'string'
          ? connection.base_url
          : typeof connection.baseUrl === 'string'
            ? connection.baseUrl
            : null,
    apiKey:
      typeof connection.api_key === 'string'
        ? connection.api_key
        : typeof connection.apiKey === 'string'
          ? connection.apiKey
          : null,
    enabled:
      typeof connection.enabled === 'boolean'
        ? connection.enabled
        : true,
  }
}

export async function syncApplicationSnapshot(params: {
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

  const productUpdateResponse = await fetch(
    `${getSupabaseRestUrl('products')}?id=eq.${params.productId}`,
    {
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
    },
  )

  if (!productUpdateResponse.ok) {
    throw new Error('The application was connected, but we could not save its live metrics yet.')
  }
}

export async function syncExistingApplication(productId: string) {
  const productResponse = await fetch(
    `${getSupabaseRestUrl('products')}?select=id,name,slug&id=eq.${productId}&limit=1`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (!productResponse.ok) {
    throw new Error('We could not load the application record right now.')
  }

  const products = (await productResponse.json()) as Array<{
    id: string
    name?: string | null
    slug?: string | null
  }>
  const product = products[0]

  if (!product?.id || !product.slug || !product.name) {
    throw new Error('We could not find that application anymore.')
  }

  const settingsResponse = await fetch(
    `${getSupabaseRestUrl('product_settings')}?select=product_id,admin_api_base_url,settings&product_id=eq.${productId}&limit=1`,
    {
      headers: getSupabaseAdminHeaders(),
      cache: 'no-store',
    },
  )

  if (!settingsResponse.ok) {
    throw new Error('We could not load the application connection settings right now.')
  }

  const settingsRows = (await settingsResponse.json()) as ProductSettingsRow[]
  const settingsRow = settingsRows[0]
  const connection = getConnectionSettings(
    settingsRow?.settings,
    settingsRow?.admin_api_base_url ?? null,
  )

  if (!connection.baseUrl || !connection.apiKey || !connection.enabled) {
    throw new Error('This application is missing an active base URL or API key.')
  }

  await syncApplicationSnapshot({
    productId: product.id,
    slug: product.slug,
    name: product.name,
    baseUrl: connection.baseUrl,
    apiKey: connection.apiKey,
  })
}
