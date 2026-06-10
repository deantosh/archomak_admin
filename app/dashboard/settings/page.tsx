'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useAdminApp } from '@/components/dashboard/admin-app-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildAdminAppApiPath } from '@/lib/admin-app-selection'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { isAllowedOfficialEmail } from '@/lib/official-verification'
import {
  KunanyeshaAdminNotificationsResponse,
  KunanyeshaAdminPaymentsSummaryResponse,
  KunanyeshaAdminSummaryResponse,
  KunanyeshaAdminSystemHealthResponse,
  KunanyeshaAdminUsersResponse,
} from '@/lib/kunanyesha-admin-types'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

type TabType = 'general' | 'security' | 'integrations' | 'notifications' | 'billing'

const settingTabs = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'security', label: 'Security', icon: '🔐' },
  { id: 'integrations', label: 'Integrations', icon: '🔌' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'billing', label: 'Billing', icon: '💳' },
]

export default function SettingsPage() {
  const { selectedApp, selectedAppKey } = useAdminApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [summary, setSummary] = useState<KunanyeshaAdminSummaryResponse | null>(null)
  const [users, setUsers] = useState<KunanyeshaAdminUsersResponse['items']>([])
  const [notifications, setNotifications] = useState<KunanyeshaAdminNotificationsResponse['items']>([])
  const [systemHealth, setSystemHealth] = useState<KunanyeshaAdminSystemHealthResponse | null>(null)
  const [paymentsSummary, setPaymentsSummary] = useState<KunanyeshaAdminPaymentsSummaryResponse | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<{
    signoff_email?: string | null
    official_verification_status?: string | null
    official_email_verified_at?: string | null
    report_access_enabled?: boolean | null
  } | null>(null)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  useEffect(() => {
    const verificationParam = searchParams.get('verification')

    if (verificationParam === 'confirmed') {
      void fetch('/api/profile-verification/confirm', {
        method: 'POST',
      })
        .then(async (response) => {
          const payload = (await response.json().catch(() => null)) as { detail?: string } | null

          if (!response.ok) {
            throw new Error(payload?.detail || 'We could not finish verification right now.')
          }

          setVerificationMessage(payload?.detail || 'Your work email is verified.')
          router.replace('/dashboard/settings')
        })
        .catch((error) => {
          setVerificationError(
            error instanceof Error ? error.message : 'We could not finish verification right now.',
          )
        })
    }
  }, [router, searchParams])

  useEffect(() => {
    if (!selectedAppKey) return

    void (async () => {
      const [
        summaryRes,
        usersRes,
        notificationsRes,
        healthRes,
        paymentsRes,
        verificationRes,
      ] = await Promise.all([
      fetch(buildAdminAppApiPath('summary'), { cache: 'no-store' }),
      fetch(buildAdminAppApiPath('users'), { cache: 'no-store' }),
      fetch(buildAdminAppApiPath('notifications'), { cache: 'no-store' }),
      fetch(buildAdminAppApiPath('system-health'), { cache: 'no-store' }),
      fetch(buildAdminAppApiPath('payments/summary'), { cache: 'no-store' }),
      fetch('/api/profile-verification', { cache: 'no-store' }),
      ])

      if (summaryRes.ok) setSummary((await summaryRes.json()) as KunanyeshaAdminSummaryResponse)
      if (usersRes.ok) setUsers(((await usersRes.json()) as KunanyeshaAdminUsersResponse).items)
      if (notificationsRes.ok) {
        setNotifications(((await notificationsRes.json()) as KunanyeshaAdminNotificationsResponse).items)
      }
      if (healthRes.ok) setSystemHealth((await healthRes.json()) as KunanyeshaAdminSystemHealthResponse)
      if (paymentsRes.ok) setPaymentsSummary((await paymentsRes.json()) as KunanyeshaAdminPaymentsSummaryResponse)
      if (verificationRes?.ok) {
        const payload = (await verificationRes.json().catch(() => null)) as
          | {
              profile?: {
                signoff_email?: string | null
                official_verification_status?: string | null
                official_email_verified_at?: string | null
                report_access_enabled?: boolean | null
              }
            }
          | null

        setVerificationStatus(payload?.profile ?? null)
        setVerificationEmail(payload?.profile?.signoff_email ?? '')
      }
    })()
  }, [selectedAppKey])

  async function handleVerificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setVerificationError(null)
    setVerificationMessage(null)
    setVerificationLoading(true)

    try {
      if (!verificationEmail || !verificationEmail.includes('@')) {
        setVerificationError('Enter a valid work email address.')
        return
      }

      if (!isAllowedOfficialEmail(verificationEmail)) {
        setVerificationError('Use a work email from an approved organization domain.')
        return
      }

      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({
        email: verificationEmail,
        data: {
          signoff_email: verificationEmail,
        },
      })

      if (error) {
        setVerificationError(
          toUserFriendlyErrorMessage(
            error.message || 'We could not send the verification email right now.',
          ),
        )
        return
      }

      const response = await fetch('/api/profile-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workEmail: verificationEmail }),
      })

      const payload = (await response.json().catch(() => null)) as { detail?: string } | null

      if (!response.ok) {
        setVerificationError(
          toUserFriendlyErrorMessage(
            payload?.detail || 'We could not send the verification email right now.',
          ),
        )
        return
      }

      setVerificationStatus({
        signoff_email: verificationEmail,
        official_verification_status: 'pending',
        official_email_verified_at: null,
        report_access_enabled: false,
      })
      setVerificationMessage(payload?.detail || 'Check your work inbox to confirm the email address.')
    } catch {
      setVerificationError('We could not send the verification email right now.')
    } finally {
      setVerificationLoading(false)
    }
  }

  const countyCount = useMemo(
    () => new Set(users.map((user) => user.county).filter(Boolean)).size,
    [users],
  )

  const criticalCount = notifications.filter((item) => item.severity === 'critical').length
  const warningCount = notifications.filter((item) => item.severity === 'warning').length

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Live platform configuration overview from {selectedApp?.name || 'the selected application'}
        </p>
      </div>

      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {settingTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Application Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Application Name</label>
                <input
                  type="text"
                  readOnly
                  value={summary?.app.name || '—'}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Environment</label>
                <input
                  type="text"
                  readOnly
                  value={summary?.app.environment || '—'}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Coverage</label>
                <textarea
                  readOnly
                  value={`Organizations: ${summary?.organizations_total ?? 0}\nUsers: ${summary?.users_total ?? 0}\nCounties represented: ${countyCount}`}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none"
                  rows={3}
                />
              </div>
              <Button className="w-full sm:w-auto" disabled>
                <Save size={16} className="mr-2" />
                Read-only Live Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Operational Security</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">System status</span>
                <Badge className="bg-emerald-500/10 text-emerald-500 capitalize">
                  {systemHealth?.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API health</span>
                <span className="font-semibold text-foreground">{summary?.app.api_health ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active users</span>
                <span className="font-semibold text-foreground">{summary?.app.active_users ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Open critical alerts</span>
                <span className="font-semibold text-foreground">{criticalCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Official Report Access</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Verification status</p>
                  <p className="text-xs text-muted-foreground">
                    Only verified work emails can unlock official report generation.
                  </p>
                </div>
                <Badge
                  className={
                    verificationStatus?.official_verification_status === 'verified'
                      ? 'bg-emerald-500/10 text-emerald-500 capitalize'
                      : verificationStatus?.official_verification_status === 'pending'
                        ? 'bg-amber-500/10 text-amber-500 capitalize'
                        : 'bg-muted text-muted-foreground capitalize'
                  }
                >
                  {verificationStatus?.official_verification_status || 'unverified'}
                </Badge>
              </div>

              {(verificationMessage || verificationError) && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    verificationError
                      ? 'border-red-500/20 bg-red-500/10 text-red-300'
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  }`}
                >
                  {verificationError || verificationMessage}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleVerificationSubmit}>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Work Email</label>
                  <Input
                    type="email"
                    value={verificationEmail}
                    onChange={(event) => setVerificationEmail(event.target.value)}
                    placeholder="name@agency.go.ke"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use your official work address. The app will send a confirmation email to that
                  mailbox and unlock report generation after verification.
                </p>
                <Button type="submit" disabled={verificationLoading}>
                  <Save size={16} className="mr-2" />
                  {verificationLoading ? 'Sending Verification…' : 'Verify Work Email'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Connected Services</h2>
            <div className="space-y-3">
              {(systemHealth?.services || []).map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.detail || 'Live probe response'}</p>
                  </div>
                  <Badge
                    className={
                      service.status === 'operational'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }
                  >
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Alert Preferences Snapshot</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Critical alerts</span>
                <span className="text-muted-foreground">{criticalCount} active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Warning alerts</span>
                <span className="text-muted-foreground">{warningCount} active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Informational alerts</span>
                <span className="text-muted-foreground">
                  {notifications.filter((item) => item.severity === 'info').length} active
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {notifications.slice(0, 4).map((item) => (
                <div key={item.id} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Payment Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">${paymentsSummary?.completed_total ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-500">${paymentsSummary?.pending_total ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-500">${paymentsSummary?.failed_total ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Billing Health</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Completed transactions</span>
                <span className="text-muted-foreground">{paymentsSummary?.completed_count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Pending transactions</span>
                <span className="text-muted-foreground">{paymentsSummary?.pending_count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Failed transactions</span>
                <span className="text-muted-foreground">{paymentsSummary?.failed_count ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
