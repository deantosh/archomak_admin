import 'server-only'

const baseUrl = process.env.KUNANYESHA_ADMIN_API_URL
const apiKey = process.env.KUNANYESHA_ADMIN_API_KEY

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

export function getAdminAppSources(): AdminAppSource[] {
  const configured = process.env.ADMIN_APP_SOURCES

  if (configured) {
    try {
      const parsed = JSON.parse(configured) as AdminAppSource[]
      return parsed.filter((item) => item?.key && item?.label && item?.baseUrl && item?.apiKey)
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
      baseUrl,
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
  const trimmedBase = source.baseUrl.replace(/\/$/, '')
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
      payload?.detail || payload?.message || `${source.label} admin request failed (${response.status})`,
    )
  }

  return payload as T
}

export async function fetchKunanyeshaAdmin(path: string, searchParams?: URLSearchParams) {
  if (!baseUrl || !apiKey) {
    throw new Error('Missing KUNANYESHA_ADMIN_API_URL or KUNANYESHA_ADMIN_API_KEY')
  }

  return fetchAdminSource(
    {
      key: 'kunanyesha',
      label: 'Kunanyesha',
      baseUrl,
      apiKey,
      icon: '🌧️',
    },
    path,
    searchParams,
  )
}
