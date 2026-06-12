import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { getSupabaseEnv } from '@/lib/supabase/config'

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getServiceRoleKey() {
  if (!serviceRoleKey) {
    throw new Error('Invitations are not fully configured yet.')
  }

  return serviceRoleKey
}

export function hasSupabaseServiceRoleEnv() {
  return Boolean(serviceRoleKey)
}

export function getSupabaseAdminHeaders() {
  return {
    apikey: getServiceRoleKey(),
    Authorization: `Bearer ${getServiceRoleKey()}`,
    'Content-Type': 'application/json',
  }
}

export function getSupabaseRestUrl(path: string) {
  const { supabaseUrl } = getSupabaseEnv()
  return `${supabaseUrl}/rest/v1/${path.replace(/^\/+/, '')}`
}

export function getSupabaseAuthAdminUrl(path: string) {
  const { supabaseUrl } = getSupabaseEnv()
  return `${supabaseUrl}/auth/v1/${path.replace(/^\/+/, '')}`
}

export function getSupabaseAdminClient() {
  const { supabaseUrl } = getSupabaseEnv()
  return createClient(supabaseUrl, getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getSupabaseStorageBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'public-assets'
}
