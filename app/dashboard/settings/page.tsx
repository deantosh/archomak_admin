'use client'

import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  KunanyeshaAdminNotificationsResponse,
  KunanyeshaAdminPaymentsSummaryResponse,
  KunanyeshaAdminSummaryResponse,
  KunanyeshaAdminSystemHealthResponse,
  KunanyeshaAdminUsersResponse,
} from '@/lib/kunanyesha-admin-types'

type TabType = 'general' | 'security' | 'integrations' | 'notifications' | 'billing'

const settingTabs = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'security', label: 'Security', icon: '🔐' },
  { id: 'integrations', label: 'Integrations', icon: '🔌' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'billing', label: 'Billing', icon: '💳' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [summary, setSummary] = useState<KunanyeshaAdminSummaryResponse | null>(null)
  const [users, setUsers] = useState<KunanyeshaAdminUsersResponse['items']>([])
  const [notifications, setNotifications] = useState<KunanyeshaAdminNotificationsResponse['items']>([])
  const [systemHealth, setSystemHealth] = useState<KunanyeshaAdminSystemHealthResponse | null>(null)
  const [paymentsSummary, setPaymentsSummary] = useState<KunanyeshaAdminPaymentsSummaryResponse | null>(null)

  useEffect(() => {
    void Promise.all([
      fetch('/api/kunanyesha-admin/summary', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/users', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/notifications', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/system-health', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/payments/summary', { cache: 'no-store' }),
    ]).then(async ([summaryRes, usersRes, notificationsRes, healthRes, paymentsRes]) => {
      if (summaryRes.ok) setSummary((await summaryRes.json()) as KunanyeshaAdminSummaryResponse)
      if (usersRes.ok) setUsers(((await usersRes.json()) as KunanyeshaAdminUsersResponse).items)
      if (notificationsRes.ok) {
        setNotifications(((await notificationsRes.json()) as KunanyeshaAdminNotificationsResponse).items)
      }
      if (healthRes.ok) setSystemHealth((await healthRes.json()) as KunanyeshaAdminSystemHealthResponse)
      if (paymentsRes.ok) setPaymentsSummary((await paymentsRes.json()) as KunanyeshaAdminPaymentsSummaryResponse)
    })
  }, [])

  const countyCount = useMemo(
    () => new Set(users.map((user) => user.county).filter(Boolean)).size,
    [users],
  )

  const criticalCount = notifications.filter((item) => item.severity === 'critical').length
  const warningCount = notifications.filter((item) => item.severity === 'warning').length

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-muted-foreground mt-1">Live platform configuration overview from Kunanyesha</p>
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
