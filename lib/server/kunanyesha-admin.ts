import 'server-only'

const baseUrl = process.env.KUNANYESHA_ADMIN_API_URL
const apiKey = process.env.KUNANYESHA_ADMIN_API_KEY
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
  key: string
  label: string
  baseUrl: string
  apiKey: string
  icon?: string
}

export function hasKunanyeshaAdminEnv() {
  return Boolean(baseUrl && apiKey)
}

function normalizeAdminBaseUrl(value: string) {
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

export function getAdminAppSources(): AdminAppSource[] {
  const configured = process.env.ADMIN_APP_SOURCES

  if (configured) {
    try {
      const parsed = JSON.parse(configured) as AdminAppSource[]
      return parsed
        .filter((item) => item?.key && item?.label && item?.baseUrl && item?.apiKey)
        .map((item) => ({
          ...item,
          baseUrl: normalizeAdminBaseUrl(item.baseUrl),
        }))
    } catch {
      return []
    }
  }

  if (!baseUrl || !apiKey) {
    return []
  }

  return [
    {
      key: 'kunanyesha',
      label: 'Kunanyesha',
      baseUrl: normalizeAdminBaseUrl(baseUrl),
      apiKey,
      icon: '🌧️',
    },
  ]
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

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${source.apiKey}`,
      apikey: source.apiKey,
    },
    cache: 'no-store',
  })

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

export async function fetchKunanyeshaAdmin(path: string, searchParams?: URLSearchParams) {
  if (!baseUrl || !apiKey) {
    throw new Error('The dashboard connection is incomplete.')
  }

  return fetchAdminSource(
    {
      key: 'kunanyesha',
      label: 'Kunanyesha',
      baseUrl: normalizeAdminBaseUrl(baseUrl),
      apiKey,
      icon: '🌧️',
    },
    path,
    searchParams,
  )
}
