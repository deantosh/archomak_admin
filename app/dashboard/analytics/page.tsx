'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartCard } from '@/components/dashboard/chart-card'
import { useAdminApp } from '@/components/dashboard/admin-app-provider'
import { AppPicker } from '@/components/dashboard/app-picker'
import { Button } from '@/components/ui/button'
import { buildAdminAppApiPath } from '@/lib/admin-app-selection'
import {
  KunanyeshaAdminLogsResponse,
  KunanyeshaAdminPaymentsResponse,
  KunanyeshaAdminSummaryResponse,
  KunanyeshaAdminUsersResponse,
} from '@/lib/kunanyesha-admin-types'

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toDayKey(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function buildLastDays(days: number) {
  const items: { key: string; label: string }[] = []
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - index)
    items.push({ key: date.toISOString().slice(0, 10), label: formatDayLabel(date) })
  }
  return items
}

export default function AnalyticsPage() {
  const { selectedApp, selectedAppKey } = useAdminApp()
  const [summary, setSummary] = useState<KunanyeshaAdminSummaryResponse | null>(null)
  const [users, setUsers] = useState<KunanyeshaAdminUsersResponse['items']>([])
  const [payments, setPayments] = useState<KunanyeshaAdminPaymentsResponse['items']>([])
  const [logs, setLogs] = useState<KunanyeshaAdminLogsResponse['items']>([])

  useEffect(() => {
    if (!selectedAppKey) return

    void Promise.all([
      fetch(buildAdminAppApiPath('summary'), { cache: 'no-store' }),
      fetch(buildAdminAppApiPath('users'), { cache: 'no-store' }),
      fetch(buildAdminAppApiPath('payments'), { cache: 'no-store' }),
      fetch(buildAdminAppApiPath('logs'), { cache: 'no-store' }),
    ]).then(async ([summaryRes, usersRes, paymentsRes, logsRes]) => {
      if (summaryRes.ok) setSummary((await summaryRes.json()) as KunanyeshaAdminSummaryResponse)
      if (usersRes.ok) setUsers(((await usersRes.json()) as KunanyeshaAdminUsersResponse).items)
      if (paymentsRes.ok) setPayments(((await paymentsRes.json()) as KunanyeshaAdminPaymentsResponse).items)
      if (logsRes.ok) setLogs(((await logsRes.json()) as KunanyeshaAdminLogsResponse).items)
    })
  }, [selectedAppKey])

  const dailyData = useMemo(() => {
    const buckets = buildLastDays(14).map((day) => ({
      date: day.label,
      key: day.key,
      revenue: 0,
      users: 0,
      requests: 0,
    }))
    const index = new Map(buckets.map((item) => [item.key, item]))

    payments.forEach((payment) => {
      const key = toDayKey(payment.created_at)
      if (!key) return
      const bucket = index.get(key)
      if (!bucket) return
      bucket.revenue += payment.amount
    })

    users.forEach((user) => {
      const key = toDayKey(user.created_at)
      if (!key) return
      const bucket = index.get(key)
      if (!bucket) return
      bucket.users += 1
    })

    logs.forEach((log) => {
      const key = toDayKey(log.created_at)
      if (!key) return
      const bucket = index.get(key)
      if (!bucket) return
      bucket.requests += 1
    })

    return buckets
  }, [payments, users, logs])

  const countyData = useMemo(() => {
    const counts = new Map<string, number>()
    users.forEach((user) => {
      const county = user.county || 'Unknown'
      counts.set(county, (counts.get(county) || 0) + 1)
    })

    const palette = ['#10B981', '#4F46E5', '#8B5CF6', '#F59E0B', '#EF4444']
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([name, value], index) => ({ name, value, fill: palette[index % palette.length] }))
  }, [users])

  const paymentStatusData = useMemo(() => {
    const counts = { completed: 0, pending: 0, failed: 0 }
    payments.forEach((payment) => {
      const status = payment.status.toLowerCase()
      if (status === 'completed') counts.completed += 1
      else if (status === 'pending') counts.pending += 1
      else counts.failed += 1
    })
    return [
      { name: 'Completed', value: counts.completed },
      { name: 'Pending', value: counts.pending },
      { name: 'Failed', value: counts.failed },
    ]
  }, [payments])

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Live platform trends from {selectedApp?.name || 'the selected application'}
          </p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Calendar size={18} className="mr-2" />
          Last 14 Days
        </Button>
      </div>

      <AppPicker className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Trend" description="Completed and attempted payments by day">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorRevLive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevLive)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Signups" description="New profiles created by day">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
              <Bar dataKey="users" fill="#4F46E5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Workflow Activity" description="Log volume per day">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Bar dataKey="requests" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="County Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={countyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}`}
                outerRadius={80}
                dataKey="value"
              >
                {countyData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Payment Outcome Mix" description="Current transaction status distribution">
        <div className="space-y-4">
          {paymentStatusData.map((item) => {
            const total = payments.length || 1
            const width = `${(item.value / total) * 100}%`
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      item.name === 'Completed'
                        ? 'bg-emerald-500'
                        : item.name === 'Pending'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width }}
                  />
                </div>
              </div>
            )
          })}
          <div className="pt-2 text-xs text-muted-foreground">
            Live totals: {summary?.users_total ?? 0} users, {summary?.reports_total ?? 0} reports,{' '}
            {summary?.app.requests_per_day ?? 0} daily requests.
          </div>
        </div>
      </ChartCard>
    </div>
  )
}
