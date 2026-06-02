'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Activity, Users, TrendingUp, Server } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { ChartCard } from '@/components/dashboard/chart-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { getStats, mockAnalyticsData, mockRecentActivity, mockApps } from '@/lib/mock-data';

const stats = getStats();

export default function DashboardPage() {
  const criticalApps = mockApps.filter(app => app.status === 'critical' || app.status === 'warning');

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Adeyemi. Here&apos;s your platform overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Applications"
          value={stats.activeApplications}
          change={5.2}
          icon={<Server size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={2.8}
          icon={<Users size={20} />}
          trend="up"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
          change={12.5}
          icon={<TrendingUp size={20} />}
          trend="up"
        />
        <StatCard
          title="System Uptime"
          value={`${stats.systemUptime}%`}
          change={-0.1}
          icon={<Activity size={20} />}
          trend="down"
        />
      </div>

      {/* Critical Alerts */}
      {criticalApps.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-500 mb-2">
            ⚠️ {criticalApps.length} Application{criticalApps.length > 1 ? 's' : ''} Needs Attention
          </p>
          <p className="text-xs text-muted-foreground">
            {criticalApps.map(app => app.name).join(', ')} {criticalApps.length === 1 ? 'is' : 'are'} experiencing issues.
          </p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Users Chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Revenue & User Growth" description="Last 27 days">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockAnalyticsData.daily}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* API Requests */}
        <div>
          <ChartCard title="API Requests" description="Daily requests">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockAnalyticsData.daily.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Bar dataKey="requests" fill="#4F46E5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Recent Activity & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="User Growth Trend" description="30-day progression">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockAnalyticsData.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#10B981"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div>
          <ChartCard title="Recent Activity" description="Latest events">
            <ActivityFeed items={mockRecentActivity} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
