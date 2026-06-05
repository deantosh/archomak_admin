import { getAuthenticatedUser } from '@/lib/supabase/server'

const DEFAULT_ALLOWED_ROLES = [
  'admin',
  'administrator',
  'staff',
  'owner',
  'super_admin',
  'superadmin',
  'operations',
  'ops',
]

export type AuthenticatedUser = {
  id: string
  email?: string
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

type AccessResult = {
  allowed: boolean
  roleLabel?: string
  displayName: string
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getMetadata(user: AuthenticatedUser) {
  return {
    ...(user.user_metadata ?? {}),
    ...(user.app_metadata ?? {}),
  } as Record<string, unknown>
}

function getDisplayName(user: AuthenticatedUser) {
  const metadata = getMetadata(user)
  const firstName = normalizeString(metadata.first_name)
  const lastName = normalizeString(metadata.last_name)

  const candidate =
    normalizeString(metadata.full_name) ||
    normalizeString(metadata.name) ||
    normalizeString(metadata.display_name) ||
    normalizeString(firstName && lastName ? `${firstName} ${lastName}` : '') ||
    normalizeString(user.email)

  return candidate || 'Archomak Staff'
}

function extractRoles(user: AuthenticatedUser) {
  const metadata = getMetadata(user)

  const roleValues = [
    metadata.role,
    metadata.user_role,
    metadata.roles,
    metadata.permissions,
  ]

  const roles = roleValues.flatMap((value) => {
    if (typeof value === 'string') {
      return value.split(',').map((role) => role.trim().toLowerCase())
    }

    if (Array.isArray(value)) {
      return value
        .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
        .filter(Boolean)
    }

    return []
  })

  if (metadata.is_admin === true || metadata.staff === true) {
    roles.push('admin')
  }

  return Array.from(new Set(roles.filter(Boolean)))
}

function getMetadataRoleLabel(user: AuthenticatedUser) {
  const [firstRole] = extractRoles(user)
  return firstRole ? toTitleCase(firstRole) : undefined
}

function isAllowedByMetadata(user: AuthenticatedUser) {
  const allowedRoles = (
    process.env.SUPABASE_ALLOWED_ADMIN_ROLES?.split(',') ?? DEFAULT_ALLOWED_ROLES
  )
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean)

  const roles = extractRoles(user)

  return roles.some((role) => allowedRoles.includes(role))
}

async function isAllowedByConfiguredTable(user: AuthenticatedUser) {
  const table = process.env.SUPABASE_ACCESS_TABLE ?? 'organization_members'

  const session = await getAuthenticatedUser()

  if (!session?.accessToken) {
    return { allowed: false as const }
  }

  const userIdColumn = process.env.SUPABASE_ACCESS_USER_ID_COLUMN ?? 'user_id'
  const emailColumn = process.env.SUPABASE_ACCESS_EMAIL_COLUMN
  const activeColumn = process.env.SUPABASE_ACCESS_ACTIVE_COLUMN ?? 'status'
  const activeValue = process.env.SUPABASE_ACCESS_ACTIVE_VALUE ?? 'active'
  const roleColumn = process.env.SUPABASE_ACCESS_ROLE_COLUMN ?? 'role'
  const allowedRoles = (
    process.env.SUPABASE_ALLOWED_ADMIN_ROLES?.split(',') ?? DEFAULT_ALLOWED_ROLES
  )
    .map((role) => role.trim())
    .filter(Boolean)
  const selectColumns = Array.from(
    new Set(
      [userIdColumn, emailColumn, activeColumn, roleColumn]
        .filter(Boolean)
        .map((column) => column as string),
    ),
  ).join(', ')

  const attempts: Array<{ column: string; value: string }> = []

  attempts.push({ column: userIdColumn, value: user.id })

  if (emailColumn && user.email) {
    attempts.push({ column: emailColumn, value: user.email })
  }

  for (const attempt of attempts) {
    const filters = new URLSearchParams({
      select: selectColumns,
      [attempt.column]: `eq.${attempt.value}`,
      limit: '1',
    })

    if (activeColumn) {
      filters.set(activeColumn, `eq.${activeValue}`)
    }

    if (roleColumn && allowedRoles.length > 0) {
      filters.set(roleColumn, `in.(${allowedRoles.join(',')})`)
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?${filters.toString()}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      continue
    }

    const rows = (await response.json()) as Array<Record<string, unknown>>
    const row = rows[0]

    if (row) {
      const roleLabel =
        roleColumn && typeof row[roleColumn] === 'string'
          ? toTitleCase(String(row[roleColumn]))
          : undefined

      return {
        allowed: true as const,
        roleLabel,
      }
    }
  }

  return { allowed: false as const }
}

export async function getDashboardAccess(user: AuthenticatedUser): Promise<AccessResult> {
  const displayName = getDisplayName(user)

  if (isAllowedByMetadata(user)) {
    return {
      allowed: true,
      displayName,
      roleLabel: getMetadataRoleLabel(user),
    }
  }

  const tableAccess = await isAllowedByConfiguredTable(user)

  return {
    allowed: tableAccess.allowed,
    displayName,
    roleLabel: tableAccess.roleLabel,
  }
}
