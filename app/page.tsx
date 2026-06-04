import { redirect } from 'next/navigation'

import { getDashboardAccess } from '@/lib/auth/access'
import { hasSupabaseEnv } from '@/lib/supabase/config'
import { clearServerSession, getAuthenticatedUser } from '@/lib/supabase/server'

export default async function Page() {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=config')
  }

  const session = await getAuthenticatedUser()
  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  const access = await getDashboardAccess(user)

  if (!access.allowed) {
    await clearServerSession()
    redirect('/login?error=access-denied')
  }

  redirect('/dashboard')
}
