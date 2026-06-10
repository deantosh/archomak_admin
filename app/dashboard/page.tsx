'use client'

import { useEffect, useState } from 'react'
import { Activity, FileText, Server, TrendingUp, Users } from 'lucide-react'

import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { EmptyState } from '@/components/dashboard/empty-state'
import { StatCard } from '@/components/dashboard/stat-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PortfolioOverviewResponse } from '@/lib/admin-portfolio-types'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString()}`
}

function mapSeverity(severity: string) {
  if (severity === 'critical') return 'error'
  if (severity === 'warning') return 'warning'
  return 'success'
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<PortfolioOverviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAppKey, setSelectedAppKey] = useState('all')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        const searchParams = new URLSearchParams()
        if (selectedAppKey !== 'all') {
          searchParams.set('app', selectedAppKey)
        }

        const response = await fetch(
          `/api/admin-overview${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
          { cache: 'no-store' },
        )

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { detail?: string; message?: string }
            | null
          throw new Error(
            toUserFriendlyErrorMessage(
              payload?.detail ||
                payload?.message ||
                'We could not load live dashboard data right now.',
            ),
          )
        }

        const data = (await response.json()) as PortfolioOverviewResponse

        if (!active) return
        setOverview(data)
        setError(null)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [selectedAppKey])

  const needsAttention =
    overview &&
    (overview.pending_reports > 0 ||
      overview.failed_payments_count > 0 ||
      overview.degraded_apps_count > 0)

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Live centralized view of operational data across all connected applications.
        </p>
        <div className="mt-4 max-w-xs">
          <Select
            value={selectedAppKey}
            onValueChange={setSelectedAppKey}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-border bg-card pr-4 pl-4 text-sm shadow-sm">
              <SelectValue placeholder="Select application view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              {(overview?.apps || []).map((app) => (
                <SelectItem key={app.source_key} value={app.source_key}>
                  {app.source_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Applications"
          value={overview ? overview.applications_count : loading ? '—' : 0}
          icon={<Server size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Users"
          value={overview ? overview.total_users.toLocaleString() : '—'}
          icon={<Users size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Revenue"
          value={overview ? formatCurrency(overview.total_revenue) : '—'}
          icon={<TrendingUp size={20} />}
          trend="up"
        />
        <StatCard
          title="Reports Generated"
          value={overview ? overview.total_reports.toLocaleString() : '—'}
          icon={<FileText size={20} />}
          trend="up"
        />
      </div>

      {needsAttention && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-400 mb-2">Attention needed</p>
          <p className="text-xs text-muted-foreground">
            {overview?.pending_reports ? `${overview.pending_reports} pending report(s). ` : ''}
            {overview?.failed_payments_count
              ? `${overview.failed_payments_count} failed payment(s). `
              : ''}
            {overview?.degraded_apps_count
              ? `${overview.degraded_apps_count} application(s) need review.`
              : ''}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Portfolio Snapshot</h2>
          {overview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-muted-foreground mb-1">Connected Applications</p>
                  <p className="font-semibold text-foreground">{overview.applications_count}</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-muted-foreground mb-1">Daily Requests</p>
                  <p className="font-semibold text-foreground">
                    {overview.total_requests_per_day.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-muted-foreground mb-1">Uploads</p>
                  <p className="font-semibold text-foreground">{overview.total_uploads.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                {overview.apps.map((app) => (
                  <div
                    key={app.source_key}
                    className="rounded-xl border border-border p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {app.source_icon || '📦'} {app.app.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {app.app.environment} · {app.app.status} · {app.users_total.toLocaleString()} users
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-foreground">{app.app.api_health}% API health</p>
                      <p className="text-xs text-muted-foreground">
                        {app.app.requests_per_day.toLocaleString()} requests/day
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon="📡"
              title={loading ? 'Loading live data…' : 'No live snapshot'}
              description="This panel will show the current application portfolio summary."
            />
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          </div>
          {overview?.activity.length ? (
            <ActivityFeed
              items={overview.activity.map((item) => ({
                id: item.id,
                icon: item.severity === 'critical' ? '⚠️' : item.severity === 'warning' ? '⏳' : '✅',
                title: `${item.source_label}: ${item.type.replace('.', ' ')}`,
                description: item.message,
                timestamp: item.timestamp,
                status: mapSeverity(item.severity),
              }))}
            />
          ) : (
            <EmptyState
              icon="🧾"
              title={loading ? 'Loading activity…' : 'No recent activity'}
              description="Latest operational events from connected applications will appear here."
            />
          )}
        </div>
      </div>
    </div>
  )
}
