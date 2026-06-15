'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, ChevronDown, FileText, Server, TrendingUp, Users } from 'lucide-react'

import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { useAdminApp } from '@/components/dashboard/admin-app-provider'
import { EmptyState } from '@/components/dashboard/empty-state'
import { StatCard } from '@/components/dashboard/stat-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

function AppLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  return (
    <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded border border-border bg-muted shrink-0">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-full w-full object-contain" />
      ) : (
        <span className="text-[9px] font-bold text-muted-foreground leading-none select-none">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  )
}

export default function DashboardPage() {
  const { apps: contextApps, selectedAppKey: globalKey, setSelectedAppKey } = useAdminApp()
  const [overview, setOverview] = useState<PortfolioOverviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // 'all' is dashboard-only — other pages always show a single app
  const [localKey, setLocalKey] = useState<string>('all')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        const response = await fetch('/api/admin-overview', { cache: 'no-store' })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { detail?: string; message?: string }
            | null
          throw new Error(
            toUserFriendlyErrorMessage(
              payload?.detail || payload?.message || 'We could not load live dashboard data right now.',
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
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [])

  function handleSelect(value: string) {
    setLocalKey(value)
    if (value !== 'all') {
      // propagate to global context so Logs/Payments/Reports switch too
      setSelectedAppKey(value)
    }
  }

  const selectedApp = useMemo(
    () =>
      localKey === 'all'
        ? null
        : (overview?.apps.find((app) => app.source_key === localKey) ?? null),
    [overview, localKey],
  )

  const dashboardView = useMemo(() => {
    if (!overview) return null

    if (!selectedApp) {
      return {
        applications_count: overview.applications_count,
        total_users: overview.total_users,
        total_revenue: overview.total_revenue,
        total_reports: overview.total_reports,
        total_uploads: overview.total_uploads,
        total_requests_per_day: overview.total_requests_per_day,
        pending_reports: overview.pending_reports,
        failed_payments_count: overview.failed_payments_count,
        degraded_apps_count: overview.degraded_apps_count,
        apps: overview.apps,
        activity: overview.activity,
      }
    }

    return {
      applications_count: 1,
      total_users: selectedApp.users_total,
      total_revenue: selectedApp.completed_payments_total,
      total_reports: selectedApp.reports_total,
      total_uploads: selectedApp.uploads_total,
      total_requests_per_day: selectedApp.app.requests_per_day,
      pending_reports: selectedApp.pending_reports,
      failed_payments_count: selectedApp.failed_payments_count,
      degraded_apps_count:
        selectedApp.app.status !== 'operational' || selectedApp.health?.status === 'degraded' ? 1 : 0,
      apps: [selectedApp],
      activity: overview.activity.filter((item) => item.source_key === selectedApp.source_key),
    }
  }, [overview, selectedApp])

  const needsAttention =
    dashboardView &&
    (dashboardView.pending_reports > 0 ||
      dashboardView.failed_payments_count > 0 ||
      dashboardView.degraded_apps_count > 0)

  // keep local selector in sync when global context changes externally
  useEffect(() => {
    if (globalKey && localKey === 'all' && overview?.apps.some((a) => a.source_key === globalKey)) {
      // don't auto-switch — let the user explicitly choose on the dashboard
    }
  }, [globalKey, localKey, overview])

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Live centralized view across all connected applications.
          </p>
        </div>

        {/* App selector — wired to global context */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm min-w-[200px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {localKey !== 'all' && (() => {
                const app = contextApps.find((a) => a.slug === localKey)
                return app ? <AppLogo name={app.name} logoUrl={app.logo_url} /> : null
              })()}
              <span className="flex-1 font-medium text-foreground">
                {localKey === 'all'
                  ? 'All Applications'
                  : (overview?.apps.find((a) => a.source_key === localKey)?.source_label ?? localKey)}
              </span>
              <ChevronDown size={14} className="text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuItem
              onSelect={() => handleSelect('all')}
              className={localKey === 'all' ? 'font-medium text-primary' : ''}
            >
              All Applications
            </DropdownMenuItem>
            {(overview?.apps ?? []).map((app) => (
              <DropdownMenuItem
                key={app.source_key}
                onSelect={() => handleSelect(app.source_key)}
                className={localKey === app.source_key ? 'font-medium text-primary' : ''}
              >
                {app.source_label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {localKey !== 'all' && (
        <div className="rounded-xl border border-border bg-muted px-4 py-2 text-xs text-muted-foreground">
          Showing data for <span className="font-medium text-foreground">{selectedApp?.source_label ?? localKey}</span>.
          Logs, Payments and Reports are filtered to this application.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Applications"
          value={dashboardView ? dashboardView.applications_count : loading ? '—' : 0}
          icon={<Server size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Users"
          value={dashboardView ? dashboardView.total_users.toLocaleString() : '—'}
          icon={<Users size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Revenue"
          value={dashboardView ? formatCurrency(dashboardView.total_revenue) : '—'}
          icon={<TrendingUp size={20} />}
          trend="up"
        />
        <StatCard
          title="Reports Generated"
          value={dashboardView ? dashboardView.total_reports.toLocaleString() : '—'}
          icon={<FileText size={20} />}
          trend="up"
        />
      </div>

      {needsAttention && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-sm font-medium text-foreground mb-1">Attention needed</p>
          <p className="text-xs text-muted-foreground">
            {dashboardView?.pending_reports ? `${dashboardView.pending_reports} pending report(s). ` : ''}
            {dashboardView?.failed_payments_count ? `${dashboardView.failed_payments_count} failed payment(s). ` : ''}
            {dashboardView?.degraded_apps_count ? `${dashboardView.degraded_apps_count} application(s) need review.` : ''}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Portfolio Snapshot</h2>
          {dashboardView ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-muted-foreground mb-1 text-xs">Connected Apps</p>
                  <p className="font-semibold text-foreground">{dashboardView.applications_count}</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-muted-foreground mb-1 text-xs">Daily Requests</p>
                  <p className="font-semibold text-foreground">{dashboardView.total_requests_per_day.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-muted-foreground mb-1 text-xs">Uploads</p>
                  <p className="font-semibold text-foreground">{dashboardView.total_uploads.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                {dashboardView.apps.map((app) => {
                  const registered = contextApps.find((a) => a.slug === app.source_key)
                  return (
                    <div
                      key={app.source_key}
                      className="rounded-xl border border-border p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AppLogo name={app.source_label} logoUrl={registered?.logo_url} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{app.source_label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {app.app.environment} · {app.app.status} · {app.users_total.toLocaleString()} users
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm shrink-0">
                        <p className="font-semibold text-foreground">{app.app.api_health}% uptime</p>
                        <p className="text-xs text-muted-foreground">{app.app.requests_per_day.toLocaleString()} req/day</p>
                      </div>
                    </div>
                  )
                })}
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
          {dashboardView?.activity.length ? (
            <ActivityFeed
              items={dashboardView.activity.map((item) => ({
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
