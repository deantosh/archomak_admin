'use client'

import { createBrowserClient } from '@supabase/ssr'

import { getSupabaseEnv } from '@/lib/supabase/config'

let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return browserClient
}
