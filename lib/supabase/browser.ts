'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseEnv } from '@/lib/supabase/config'

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return browserClient
}
