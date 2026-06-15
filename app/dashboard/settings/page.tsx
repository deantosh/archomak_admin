'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Layers, LogOut, Shield, User } from 'lucide-react'

import { useAdminApp } from '@/components/dashboard/admin-app-provider'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Badge } from '@/components/ui/badge'

type TabType = 'general' | 'apps' | 'access' | 'danger'

type Profile = {
  email: string | null
  displayName: string
  role: string | null
  allowedRoles: string[]
  accessTable: string
}

const tabs: { id: TabType; label: string; icon: typeof User }[] = [
  { id: 'general', label: 'General', icon: User },
  { id: 'apps', label: 'Connected Apps', icon: Layers },
  { id: 'access', label: 'Access', icon: Shield },
  { id: 'danger', label: 'Danger', icon: LogOut },
]

function statusBadgeClass(status: string) {
  if (status === 'operational') return 'bg-emerald-500/10 text-emerald-500'
  if (status === 'warning') return 'bg-amber-500/10 text-amber-500'
  return 'bg-red-500/10 text-red-500'
}

export default function SettingsPage() {
  const { apps } = useAdminApp()
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void fetch('/api/auth/profile', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          if (active) setProfileError('We could not load your profile right now.')
          return
        }
        const data = (await res.json()) as Profile
        if (active) setProfile(data)
      })
      .catch(() => {
        if (active) setProfileError('We could not load your profile right now.')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your admin dashboard account and connections
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar tabs */}
        <nav className="flex flex-row gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Your Profile</h2>
                {profileError && (
                  <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
                    {profileError}
                  </div>
                )}
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium text-foreground text-right">
                      {profile?.displayName ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-foreground text-right break-all">
                      {profile?.email ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Role</span>
                    {profile?.role ? (
                      <Badge className="bg-primary/10 text-primary">{profile.role}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Session</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign out of the admin dashboard on this device.
                </p>
                <SignOutButton className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors" />
              </div>
            </div>
          )}

          {activeTab === 'apps' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h2 className="text-lg font-semibold text-foreground">Connected Apps</h2>
                  <span className="text-sm text-muted-foreground">
                    {apps.length} connected
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Applications connected to this admin dashboard. Manage connections, API keys,
                  and metrics on the{' '}
                  <Link href="/dashboard/apps" className="text-primary hover:underline">
                    Applications
                  </Link>{' '}
                  page.
                </p>

                {apps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No applications connected yet.</p>
                ) : (
                  <div className="rounded-xl border border-border divide-y divide-border">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{app.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {app.environment}
                          </p>
                        </div>
                        <Badge className={statusBadgeClass(app.status)}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Access Control</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Access to this dashboard is controlled via the Supabase{' '}
                  <span className="font-mono text-foreground">
                    {profile?.accessTable ?? 'organization_members'}
                  </span>{' '}
                  table. Users must have an allowed role to sign in.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Allowed roles</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.allowedRoles ?? []).length > 0 ? (
                      profile?.allowedRoles.map((role) => (
                        <Badge key={role} variant="secondary" className="font-mono">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-card border border-red-500/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Sign out</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  End your current session and return to the sign-in screen.
                </p>
                <SignOutButton className="inline-flex items-center rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
