'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartCard } from '@/components/dashboard/chart-card'
import {
  KunanyeshaAdminLogsResponse,
  KunanyeshaAdminNotificationsResponse,
  KunanyeshaAdminReportsSummaryResponse,
  KunanyeshaAdminSummaryResponse,
  KunanyeshaAdminSystemHealthResponse,
} from '@/lib/kunanyesha-admin-types'

export default function AIToolsPage() {
  const [summary, setSummary] = useState<KunanyeshaAdminSummaryResponse | null>(null)
  const [reports, setReports] = useState<KunanyeshaAdminReportsSummaryResponse | null>(null)
  const [notifications, setNotifications] = useState<KunanyeshaAdminNotificationsResponse['items']>([])
  const [logs, setLogs] = useState<KunanyeshaAdminLogsResponse['items']>([])
  const [health, setHealth] = useState<KunanyeshaAdminSystemHealthResponse | null>(null)

  useEffect(() => {
    void Promise.all([
      fetch('/api/kunanyesha-admin/summary', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/reports/summary', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/notifications', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/logs', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/system-health', { cache: 'no-store' }),
    ]).then(async ([summaryRes, reportsRes, notificationsRes, logsRes, healthRes]) => {
      if (summaryRes.ok) setSummary((await summaryRes.json()) as KunanyeshaAdminSummaryResponse)
      if (reportsRes.ok) setReports((await reportsRes.json()) as KunanyeshaAdminReportsSummaryResponse)
      if (notificationsRes.ok) {
        setNotifications(((await notificationsRes.json()) as KunanyeshaAdminNotificationsResponse).items)
      }
      if (logsRes.ok) setLogs(((await logsRes.json()) as KunanyeshaAdminLogsResponse).items)
      if (healthRes.ok) setHealth((await healthRes.json()) as KunanyeshaAdminSystemHealthResponse)
    })
  }, [])

  const chartData = useMemo(
    () => [
      { name: 'Completed Reports', value: reports?.completed_reports ?? 0 },
      { name: 'Pending Reports', value: reports?.pending_reports ?? 0 },
      { name: 'Failed Reports', value: reports?.failed_reports ?? 0 },
      { name: 'Alerts', value: notifications.length },
      { name: 'Workflow Events', value: logs.length },
    ],
    [reports, notifications.length, logs.length],
  )

  const criticalSignals = notifications.filter((item) => item.severity === 'critical').length
  const warningSignals = notifications.filter((item) => item.severity === 'warning').length

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">AI Operations</h1>
        <p className="text-muted-foreground mt-1">Live automation and intelligence signals across Kunanyesha</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Automated Outputs</p>
          <p className="text-3xl font-bold text-foreground">{reports?.completed_reports ?? '—'}</p>
          <p className="text-xs text-emerald-500 mt-2">Completed report generations</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Active Signals</p>
          <p className="text-3xl font-bold text-foreground">{notifications.length}</p>
          <p className="text-xs text-amber-500 mt-2">
            {criticalSignals} critical, {warningSignals} warning
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Platform Intelligence Score</p>
          <p className="text-3xl font-bold text-foreground">{summary?.app.api_health ?? 0}%</p>
          <p className="text-xs text-muted-foreground mt-2">Derived from live API health</p>
        </div>
      </div>

      <ChartCard title="Automation Load" description="Live operational indicators">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            <Bar dataKey="value" fill="#4F46E5" radius={[8, 8, 0, 0]} name="Live Count" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Pipeline</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Current State</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Signal</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {(health?.services || []).map((service) => (
              <tr key={service.name} className="border-b border-border hover:bg-muted/50">
                <td className="px-6 py-4 font-medium text-foreground">{service.name}</td>
                <td className="px-6 py-4 text-foreground capitalize">{service.status}</td>
                <td className="px-6 py-4 text-muted-foreground">{service.detail || 'Live service probe'}</td>
                <td className="px-6 py-4">
                  <span
                    className={`text-sm ${
                      service.status === 'operational' ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {service.status === 'operational' ? 'Healthy' : 'Needs review'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
