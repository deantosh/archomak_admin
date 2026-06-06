'use client'

import { useEffect, useState } from 'react'
import { Activity, FileText, Server, TrendingUp, Users } from 'lucide-react'

import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { EmptyState } from '@/components/dashboard/empty-state'
import { StatCard } from '@/components/dashboard/stat-card'
import {
  KunanyeshaAdminActivityResponse,
  KunanyeshaAdminHealthResponse,
  KunanyeshaAdminSummaryResponse,
} from '@/lib/kunanyesha-admin-types'

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString()}`
}

function mapSeverity(severity: string) {
  if (severity === 'critical') return 'error'
  if (severity === 'warning') return 'warning'
  return 'success'
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<KunanyeshaAdminSummaryResponse | null>(null)
  const [activity, setActivity] = useState<KunanyeshaAdminActivityResponse['items']>([])
  const [health, setHealth] = useState<KunanyeshaAdminHealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        const [summaryRes, activityRes, healthRes] = await Promise.all([
          fetch('/api/kunanyesha-admin/summary', { cache: 'no-store' }),
          fetch('/api/kunanyesha-admin/activity', { cache: 'no-store' }),
          fetch('/api/kunanyesha-admin/health', { cache: 'no-store' }),
        ])

        if (!summaryRes.ok || !activityRes.ok || !healthRes.ok) {
          throw new Error('We could not load live dashboard data right now.')
        }

        const [summaryData, activityData, healthData] = await Promise.all([
          summaryRes.json() as Promise<KunanyeshaAdminSummaryResponse>,
          activityRes.json() as Promise<KunanyeshaAdminActivityResponse>,
          healthRes.json() as Promise<KunanyeshaAdminHealthResponse>,
        ])

        if (!active) return
        setSummary(summaryData)
        setActivity(activityData.items)
        setHealth(healthData)
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
  }, [])

  const needsAttention =
    summary &&
    (summary.pending_reports > 0 ||
      summary.failed_payments_count > 0 ||
      health?.status === 'degraded')

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Live centralized view of Kunanyesha operational data.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Applications"
          value={summary ? 1 : loading ? '—' : 0}
          icon={<Server size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Users"
          value={summary ? summary.users_total.toLocaleString() : '—'}
          icon={<Users size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Revenue"
          value={summary ? formatCurrency(summary.completed_payments_total) : '—'}
          icon={<TrendingUp size={20} />}
          trend="up"
        />
        <StatCard
          title="Reports Generated"
          value={summary ? summary.reports_total.toLocaleString() : '—'}
          icon={<FileText size={20} />}
          trend="up"
        />
      </div>

      {needsAttention && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-400 mb-2">Attention needed</p>
          <p className="text-xs text-muted-foreground">
            {summary?.pending_reports ? `${summary.pending_reports} pending report(s). ` : ''}
            {summary?.failed_payments_count
              ? `${summary.failed_payments_count} failed payment(s). `
              : ''}
            {health?.status === 'degraded' ? 'System health is degraded.' : ''}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Application Snapshot</h2>
          {summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-border p-4">
                <p className="text-muted-foreground mb-1">Application</p>
                <p className="font-semibold text-foreground">{summary.app.name}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-muted-foreground mb-1">Status</p>
                <p className="font-semibold text-foreground capitalize">{summary.app.status}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-muted-foreground mb-1">API Health</p>
                <p className="font-semibold text-foreground">{summary.app.api_health}%</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-muted-foreground mb-1">Daily Requests</p>
                <p className="font-semibold text-foreground">
                  {summary.app.requests_per_day.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-muted-foreground mb-1">Uploads</p>
                <p className="font-semibold text-foreground">
                  {summary.uploads_total.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-muted-foreground mb-1">Environment</p>
                <p className="font-semibold text-foreground capitalize">
                  {summary.app.environment}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="📡"
              title={loading ? 'Loading live data…' : 'No live snapshot'}
              description="This panel will show the current Kunanyesha application summary."
            />
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          </div>
          {activity.length > 0 ? (
            <ActivityFeed
              items={activity.map((item) => ({
                id: item.id,
                icon: item.severity === 'critical' ? '⚠️' : item.severity === 'warning' ? '⏳' : '✅',
                title: item.type.replace('.', ' '),
                description: item.message,
                timestamp: item.timestamp,
                status: mapSeverity(item.severity),
              }))}
            />
          ) : (
            <EmptyState
              icon="🧾"
              title={loading ? 'Loading activity…' : 'No recent activity'}
              description="Latest operational events from Kunanyesha will appear here."
            />
          )}
        </div>
      </div>
    </div>
  )
}
