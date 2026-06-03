import type { User } from '@supabase/supabase-js'

import { createSupabaseServerClient } from '@/lib/supabase/server'

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

function getDisplayName(user: User) {
  const metadata = {
    ...user.user_metadata,
    ...user.app_metadata,
  } as Record<string, unknown>

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

function extractRoles(user: User) {
  const metadata = {
    ...user.user_metadata,
    ...user.app_metadata,
  } as Record<string, unknown>

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

function getMetadataRoleLabel(user: User) {
  const [firstRole] = extractRoles(user)
  return firstRole ? toTitleCase(firstRole) : undefined
}

function isAllowedByMetadata(user: User) {
  const allowedRoles = (
    process.env.SUPABASE_ALLOWED_ADMIN_ROLES?.split(',') ?? DEFAULT_ALLOWED_ROLES
  )
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean)

  const roles = extractRoles(user)

  return roles.some((role) => allowedRoles.includes(role))
}

async function isAllowedByConfiguredTable(user: User) {
  const table = process.env.SUPABASE_ACCESS_TABLE

  if (!table) {
    return { allowed: false as const }
  }

  const supabase = await createSupabaseServerClient()
  const userIdColumn = process.env.SUPABASE_ACCESS_USER_ID_COLUMN ?? 'user_id'
  const emailColumn = process.env.SUPABASE_ACCESS_EMAIL_COLUMN ?? 'email'
  const activeColumn = process.env.SUPABASE_ACCESS_ACTIVE_COLUMN
  const roleColumn = process.env.SUPABASE_ACCESS_ROLE_COLUMN
  const allowedRoles = (process.env.SUPABASE_ALLOWED_ADMIN_ROLES ?? '')
    .split(',')
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

  if (userIdColumn) {
    attempts.push({ column: userIdColumn, value: user.id })
  }

  if (user.email) {
    attempts.push({ column: emailColumn, value: user.email })
  }

  for (const attempt of attempts) {
    let query = supabase.from(table).select(selectColumns).eq(attempt.column, attempt.value).limit(1)

    if (activeColumn) {
      query = query.eq(activeColumn, true)
    }

    if (roleColumn && allowedRoles.length > 0) {
      query = query.in(roleColumn, allowedRoles)
    }

    const { data, error } = await query.maybeSingle()

    if (!error && data) {
      const roleLabel =
        roleColumn && typeof data[roleColumn] === 'string'
          ? toTitleCase(String(data[roleColumn]))
          : undefined

      return {
        allowed: true as const,
        roleLabel,
      }
    }
  }

  return { allowed: false as const }
}

export async function getDashboardAccess(user: User): Promise<AccessResult> {
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
