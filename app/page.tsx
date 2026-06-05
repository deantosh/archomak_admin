import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'
import { getDashboardAccess } from '@/lib/auth/access'
import { hasSupabaseEnv } from '@/lib/supabase/config'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const type = typeof params.type === 'string' ? params.type : undefined
  const tokenHash =
    typeof params.token_hash === 'string' ? params.token_hash : undefined
  const code = typeof params.code === 'string' ? params.code : undefined

  if (type === 'recovery' && (tokenHash || code)) {
    const redirectParams = new URLSearchParams()

    if (type) redirectParams.set('type', type)
    if (tokenHash) redirectParams.set('token_hash', tokenHash)
    if (code) redirectParams.set('code', code)

    redirect(`/reset-password?${redirectParams.toString()}`)
  }

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
