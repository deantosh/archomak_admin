import 'server-only'

const baseUrl = process.env.KUNANYESHA_ADMIN_API_URL
const apiKey = process.env.KUNANYESHA_ADMIN_API_KEY

export function hasKunanyeshaAdminEnv() {
  return Boolean(baseUrl && apiKey)
}

export async function fetchKunanyeshaAdmin(path: string, searchParams?: URLSearchParams) {
  if (!baseUrl || !apiKey) {
    throw new Error('Missing KUNANYESHA_ADMIN_API_URL or KUNANYESHA_ADMIN_API_KEY')
  }

  const trimmedBase = baseUrl.replace(/\/$/, '')
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
      Authorization: `Bearer ${apiKey}`,
      apikey: apiKey,
    },
    cache: 'no-store',
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(
      payload?.detail || payload?.message || `Kunanyesha admin request failed (${response.status})`,
    )
  }

  return payload
}
