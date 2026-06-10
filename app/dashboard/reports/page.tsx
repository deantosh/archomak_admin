'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartCard } from '@/components/dashboard/chart-card'
import { useAdminApp } from '@/components/dashboard/admin-app-provider'
import { Button } from '@/components/ui/button'
import { buildAdminAppApiPath } from '@/lib/admin-app-selection'
import { KunanyeshaAdminReportsSummaryResponse } from '@/lib/kunanyesha-admin-types'
import { OfficialVerificationStatus } from '@/lib/official-verification'

const reportTypes = [
  { title: 'Performance Summary', description: 'Operational totals from the selected application', icon: '📊' },
  { title: 'User Coverage', description: 'Live platform usage and team footprint', icon: '👥' },
  { title: 'Payment Summary', description: 'Completed, pending, and failed payments', icon: '💳' },
  { title: 'Workflow Reports', description: 'Generated reports and processing status', icon: '🧾' },
]

function formatDate(dateString?: string | null) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ReportsPage() {
  const { selectedApp, selectedAppKey } = useAdminApp()
  const [summary, setSummary] = useState<KunanyeshaAdminReportsSummaryResponse | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<{
    official_verification_status?: OfficialVerificationStatus | null
    report_access_enabled?: boolean | null
    signoff_email?: string | null
  } | null>(null)

  useEffect(() => {
    if (!selectedAppKey) return

    void fetch(buildAdminAppApiPath('reports/summary'), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: KunanyeshaAdminReportsSummaryResponse | null) => {
        setSummary(data)
      })

    void fetch('/api/profile-verification', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setVerificationStatus(data?.profile ?? null)
      })
  }, [selectedAppKey])

  const canGenerateReports = Boolean(verificationStatus?.report_access_enabled)

  const chartData = useMemo(
    () =>
      summary
        ? [
            { name: 'Completed', value: summary.completed_reports },
            { name: 'Pending', value: summary.pending_reports },
            { name: 'Failed', value: summary.failed_reports },
          ]
        : [],
    [summary],
  )

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Live report generation visibility from {selectedApp?.name || 'the selected application'}
          </p>
        </div>
        <Button disabled={!canGenerateReports}>
          <Download size={18} className="mr-2" />
          {canGenerateReports ? 'Export Summary' : 'Verification Required'}
        </Button>
      </div>

      {!canGenerateReports && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          Official report generation is locked until your work email is verified in Settings.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Reports</p>
          <p className="text-3xl font-bold text-foreground">{summary?.total_reports ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-2">Generated across the app</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Completed</p>
          <p className="text-3xl font-bold text-emerald-500">{summary?.completed_reports ?? '—'}</p>
          <p className="text-xs text-muted-foreground mt-2">Ready for users</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Last Generated</p>
          <p className="text-lg font-bold text-foreground">{formatDate(summary?.last_generated_at)}</p>
          <p className="text-xs text-muted-foreground mt-2">Most recent report completion</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-200"
            >
              <div className="text-3xl mb-3">{report.icon}</div>
              <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button variant="outline" size="sm" className="w-full" disabled={!canGenerateReports}>
                {canGenerateReports ? 'Generate' : 'Verification Required'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Value</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Context</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  metric: 'Completed reports',
                  value: summary?.completed_reports ?? '—',
                  context: 'Reports available to end users',
                },
                {
                  metric: 'Pending reports',
                  value: summary?.pending_reports ?? '—',
                  context: 'Still processing in workflows',
                },
                {
                  metric: 'Failed reports',
                  value: summary?.failed_reports ?? '—',
                  context: 'Need attention or retry',
                },
              ].map((row) => (
                <tr key={row.metric} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{row.metric}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{row.value}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{row.context}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChartCard
        title="Report Status Breakdown"
        description={`Live counts from ${selectedApp?.name || 'the selected application'}`}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
