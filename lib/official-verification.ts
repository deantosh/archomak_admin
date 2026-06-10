export type OfficialVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function getOfficialEmailDomains() {
  const rawDomains =
    process.env.OFFICIAL_EMAIL_DOMAINS || process.env.NEXT_PUBLIC_OFFICIAL_EMAIL_DOMAINS || ''

  return rawDomains
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
}

export function getEmailDomain(email: string) {
  const normalized = normalizeEmail(email)
  const atIndex = normalized.lastIndexOf('@')

  if (atIndex === -1) {
    return ''
  }

  return normalized.slice(atIndex + 1)
}

export function isAllowedOfficialEmail(email: string) {
  const domains = getOfficialEmailDomains()

  if (domains.length === 0) {
    return true
  }

  return domains.includes(getEmailDomain(email))
}

export function isOfficialVerificationComplete(status?: string | null, email?: string | null) {
  return Boolean(status === 'verified' && email)
}
