'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, Database, Globe, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  KunanyeshaAdminHealthResponse,
  KunanyeshaAdminLogsResponse,
  KunanyeshaAdminSummaryResponse,
  KunanyeshaAdminSystemHealthResponse,
} from '@/lib/kunanyesha-admin-types'

const upstreamEndpoints = [
  '/summary',
  '/health',
  '/activity',
  '/users',
  '/payments',
  '/payments/summary',
  '/reports/summary',
  '/logs',
  '/notifications',
  '/system-health',
]

export default function DeveloperPage() {
  const [summary, setSummary] = useState<KunanyeshaAdminSummaryResponse | null>(null)
  const [health, setHealth] = useState<KunanyeshaAdminHealthResponse | null>(null)
  const [systemHealth, setSystemHealth] = useState<KunanyeshaAdminSystemHealthResponse | null>(null)
  const [logs, setLogs] = useState<KunanyeshaAdminLogsResponse['items']>([])

  useEffect(() => {
    void Promise.all([
      fetch('/api/kunanyesha-admin/summary', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/health', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/system-health', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/logs', { cache: 'no-store' }),
    ]).then(async ([summaryRes, healthRes, systemHealthRes, logsRes]) => {
      if (summaryRes.ok) setSummary((await summaryRes.json()) as KunanyeshaAdminSummaryResponse)
      if (healthRes.ok) setHealth((await healthRes.json()) as KunanyeshaAdminHealthResponse)
      if (systemHealthRes.ok) setSystemHealth((await systemHealthRes.json()) as KunanyeshaAdminSystemHealthResponse)
      if (logsRes.ok) setLogs(((await logsRes.json()) as KunanyeshaAdminLogsResponse).items)
    })
  }, [])

  const recentLogs = useMemo(() => logs.slice(0, 5), [logs])

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Developer</h1>
        <p className="text-muted-foreground mt-1">Live integration, proxy, and upstream service visibility</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Proxy Status</p>
          <p className="text-3xl font-bold text-foreground">Live</p>
          <p className="text-xs text-emerald-500 mt-2">Server-side bridge is active</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Daily Requests</p>
          <p className="text-3xl font-bold text-foreground">{summary?.app.requests_per_day ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-2">Reported by Kunanyesha summary endpoint</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Service Trust</p>
          <p className="text-3xl font-bold text-foreground">{summary?.app.api_health ?? 0}%</p>
          <p className="text-xs text-muted-foreground mt-2">Live API health score</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Upstream Endpoints</h2>
          <Button size="sm">Refresh Schema</Button>
        </div>

        <div className="space-y-3">
          {upstreamEndpoints.map((endpoint) => (
            <div key={endpoint} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">GET {endpoint}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Served through `/api/kunanyesha-admin`</p>
                  </div>
                </div>
                <span className="text-sm text-emerald-500 font-medium">Available</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Access</p>
                  <p className="font-semibold text-foreground">Server-only</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Auth</p>
                  <p className="font-semibold text-foreground">Service Key</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Health</p>
                  <p className="font-semibold text-foreground capitalize">{health?.status || 'unknown'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-primary" />
            <h2 className="text-xl font-bold text-foreground">Service Matrix</h2>
          </div>
          <div className="space-y-3">
            {(systemHealth?.services || []).map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.detail || 'Live service probe'}</p>
                </div>
                <span className={service.status === 'operational' ? 'text-emerald-500' : 'text-amber-500'}>
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-primary" />
            <h2 className="text-xl font-bold text-foreground">Recent Workflow Events</h2>
          </div>
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-foreground">{log.stage || 'workflow'}</p>
                <p className="text-xs text-muted-foreground mt-1">{log.message || 'No message captured'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-primary" />
          <h2 className="text-xl font-bold text-foreground">Rate Limits</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              name: 'API Request Throughput',
              current: summary?.app.requests_per_day ?? 0,
              limit: 100000,
              unit: 'requests/day',
            },
            {
              name: 'Workflow Event Volume',
              current: logs.length,
              limit: 1000,
              unit: 'events/day snapshot',
            },
          ].map((limit) => (
            <div key={limit.name}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground">{limit.name}</p>
                <span className="text-sm text-muted-foreground">
                  {limit.current.toLocaleString()} / {limit.limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min((limit.current / limit.limit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{limit.unit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
