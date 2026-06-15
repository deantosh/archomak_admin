import 'server-only'

import { cache } from 'react'

import { getSupabaseAdminHeaders, getSupabaseRestUrl, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'

const KNOWN_ADMIN_ENDPOINTS = [
  'summary',
  'health',
  'activity',
  'users',
  'payments',
  'payments/summary',
  'reports/summary',
  'logs',
  'notifications',
  'system-health',
]

export interface AdminAppSource {
  id?: string
  key: string
  label: string
  baseUrl: string
  apiKey: string
  icon?: string
  logoUrl?: string | null
}

type ProductRow = {
  id: string
  name?: string | null
  slug?: string | null
  icon?: string | null
}

type ProductSettingsRow = {
  product_id: string
  admin_api_base_url?: string | null
  settings?: Record<string, unknown> | null
}

export function normalizeAdminBaseUrl(value: string) {
  let normalized = value.trim().replace(/\/$/, '')

  for (const endpoint of KNOWN_ADMIN_ENDPOINTS.sort((left, right) => right.length - left.length)) {
    const suffix = `/${endpoint}`
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length)
      break
    }
  }

  return normalized
}

function getConnectionSettings(
  settings: Record<string, unknown> | null | undefined,
  adminApiBaseUrl?: string | null,
) {
  const connection =
    (settings?.connection as Record<string, unknown> | undefined) ||
    (settings?.admin_api as Record<string, unknown> | undefined) ||
    {}

  const baseUrl =
    typeof adminApiBaseUrl === 'string' && adminApiBaseUrl.trim()
      ? adminApiBaseUrl
      : typeof connection.base_url === 'string'
        ? connection.base_url
        : typeof connection.baseUrl === 'string'
          ? connection.baseUrl
          : null

  const apiKey =
    typeof connection.api_key === 'string'
      ? connection.api_key
      : typeof connection.apiKey === 'string'
        ? connection.apiKey
        : null

  const enabledRaw =
    typeof connection.enabled === 'boolean'
      ? connection.enabled
      : typeof settings?.connection_enabled === 'boolean'
        ? settings.connection_enabled
        : true

  return {
    baseUrl,
    apiKey,
    enabled: enabledRaw !== false,
  }
}

export function getEnvAdminSources(): AdminAppSource[] {
  const baseUrl = process.env.KUNANYESHA_ADMIN_API_URL?.trim()
  const apiKey = process.env.KUNANYESHA_ADMIN_API_KEY?.trim()
  if (!baseUrl || !apiKey) return []
  return [
    {
      key: 'kunanyesha',
      label: 'Kunanyesha',
      baseUrl: normalizeAdminBaseUrl(baseUrl),
      apiKey,
      icon: '🌦️',
      logoUrl: '/kunanyesha-logo.png',
    },
  ]
}

const fetchDatabaseAdminSources = cache(async (): Promise<AdminAppSource[]> => {
  if (!hasSupabaseServiceRoleEnv()) {
    return []
  }

  try {
    const productsResponse = await fetch(
      `${getSupabaseRestUrl('products')}?select=id,name,slug,icon&order=created_at.desc`,
      {
        headers: getSupabaseAdminHeaders(),
        cache: 'no-store',
      },
    )

    if (!productsResponse.ok) {
      return []
    }

    const products = (await productsResponse.json()) as ProductRow[]

    if (!products.length) {
      return []
    }

    const productIds = products.map((product) => product.id).filter(Boolean)
    const settingsResponse = await fetch(
      `${getSupabaseRestUrl('product_settings')}?select=product_id,admin_api_base_url,settings&product_id=in.(${productIds.join(',')})`,
      {
        headers: getSupabaseAdminHeaders(),
        cache: 'no-store',
      },
    )

    if (!settingsResponse.ok) {
      return []
    }

    const settingsRows = (await settingsResponse.json()) as ProductSettingsRow[]
    const settingsByProductId = new Map(settingsRows.map((row) => [row.product_id, row]))

    const sources: AdminAppSource[] = []

    for (const product of products) {
      const row = settingsByProductId.get(product.id)
      const connection = getConnectionSettings(row?.settings, row?.admin_api_base_url)

      if (!product.slug || !product.name || !connection.baseUrl || !connection.apiKey || !connection.enabled) {
        continue
      }

      sources.push({
        id: product.id,
        key: product.slug,
        label: product.name,
        baseUrl: normalizeAdminBaseUrl(connection.baseUrl),
        apiKey: connection.apiKey,
        icon: product.icon ?? '📦',
      })
    }

    return sources
  } catch {
    return []
  }
})

export async function getAdminAppSources(): Promise<AdminAppSource[]> {
  const [dbSources, envSources] = await Promise.all([
    fetchDatabaseAdminSources(),
    Promise.resolve(getEnvAdminSources()),
  ])

  const merged = [...dbSources]
  for (const envSource of envSources) {
    if (!merged.some((s) => s.key === envSource.key)) {
      merged.push(envSource)
    }
  }

  return merged
}

export async function getAdminAppSourceByKey(appKey?: string | null) {
  const sources = await getAdminAppSources()

  if (!sources.length) {
    return null
  }

  if (!appKey) {
    return sources[0]
  }

  return sources.find((source) => source.key === appKey) ?? sources[0]
}

export function hasKunanyeshaAdminEnv() {
  return hasSupabaseServiceRoleEnv()
}

export async function fetchKunanyeshaAdmin<T>(
  path: string,
  searchParams?: URLSearchParams,
): Promise<T> {
  const source = await getAdminAppSourceByKey()
  if (!source) {
    throw new Error('No admin application connection configured.')
  }
  return fetchAdminSource<T>(source, path, searchParams)
}

export async function fetchAdminSource<T>(
  source: AdminAppSource,
  path: string,
  searchParams?: URLSearchParams,
): Promise<T> {
  const trimmedBase = normalizeAdminBaseUrl(source.baseUrl)
  const trimmedPath = path.replace(/^\/+/, '')
  const url = new URL(`${trimmedBase}/${trimmedPath}`)

  if (searchParams) {
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
  }

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${source.apiKey}`,
        apikey: source.apiKey,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new Error(`${source.label} did not respond within 15 seconds.`)
    }
    throw err
  }

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(
      payload?.detail ||
        payload?.message ||
        `${source.label} admin request failed (${response.status}) at ${url.pathname}`,
    )
  }

  return payload as T
}
