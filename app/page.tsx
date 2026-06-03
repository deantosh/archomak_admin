import { redirect } from 'next/navigation'

import { getDashboardAccess } from '@/lib/auth/access'
import { hasSupabaseEnv } from '@/lib/supabase/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function Page() {
  if (!hasSupabaseEnv()) {
    redirect('/admin/login?error=config')
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const access = await getDashboardAccess(user)

  if (!access.allowed) {
    redirect('/admin/login?error=access-denied')
  }

  redirect('/dashboard')
}
