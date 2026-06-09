import { redirect } from 'next/navigation'

import { AdminAppProvider } from '@/components/dashboard/admin-app-provider'
import { DashboardHeader } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { getDashboardAccess } from '@/lib/auth/access'
import { hasSupabaseEnv } from '@/lib/supabase/config'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!hasSupabaseEnv()) {
    redirect('/?error=config')
  }

  const session = await getAuthenticatedUser()
  const user = session?.user

  if (!user) {
    redirect('/')
  }

  const access = await getDashboardAccess(user)

  if (!access.allowed) {
    redirect('/?error=access-denied')
  }

  return (
    <AdminAppProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <DashboardHeader
          user={{
            displayName: access.displayName,
            email: user.email ?? '',
            roleLabel: access.roleLabel ?? 'Staff',
          }}
        />
        <main className="pt-16 lg:pl-64 pb-6">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </AdminAppProvider>
  )
}
