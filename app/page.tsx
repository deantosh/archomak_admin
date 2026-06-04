import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { getDashboardAccess } from '@/lib/auth/access'
import { hasSupabaseEnv } from '@/lib/supabase/config'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Page() {
  if (hasSupabaseEnv()) {
    const session = await getAuthenticatedUser()
    const user = session?.user

    if (user) {
      const access = await getDashboardAccess(user)

      if (access.allowed) {
        redirect('/dashboard')
      }
    }
  }

  return (
    <AuthShell>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
