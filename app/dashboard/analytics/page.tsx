'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/dashboard/chart-card';
import { mockAnalyticsData } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

const deviceData = [
  { name: 'Desktop', value: 45, fill: '#10B981' },
  { name: 'Mobile', value: 35, fill: '#4F46E5' },
  { name: 'Tablet', value: 20, fill: '#8B5CF6' },
];

const regionData = [
  { name: 'Africa', value: 35 },
  { name: 'Europe', value: 25 },
  { name: 'Asia', value: 22 },
  { name: 'Americas', value: 18 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track performance and user metrics</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Calendar size={18} className="mr-2" />
          Last 30 Days
        </Button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Trend" description="Daily revenue over 30 days">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockAnalyticsData.daily}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User Growth" description="Active users progression">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockAnalyticsData.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#4F46E5"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="API Requests Over Time" description="Daily API request volume">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockAnalyticsData.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Bar dataKey="requests" fill="#4F46E5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Device Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Regional Breakdown */}
      <ChartCard title="Geographic Distribution" description="User base by region">
        <div className="space-y-4">
          {regionData.map((region) => (
            <div key={region.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{region.name}</span>
                <span className="text-sm text-muted-foreground">{region.value}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${region.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
