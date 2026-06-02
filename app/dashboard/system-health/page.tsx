'use client';

import { Activity, Server, Database, Zap, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChartCard } from '@/components/dashboard/chart-card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const systemData = [
  { time: '00:00', cpu: 45, memory: 62, requests: 1200 },
  { time: '04:00', cpu: 32, memory: 48, requests: 890 },
  { time: '08:00', cpu: 68, memory: 75, requests: 2100 },
  { time: '12:00', cpu: 55, memory: 70, requests: 1800 },
  { time: '16:00', cpu: 78, memory: 82, requests: 2500 },
  { time: '20:00', cpu: 62, memory: 71, requests: 2000 },
  { time: '23:59', cpu: 48, memory: 60, requests: 1400 },
];

const services = [
  { name: 'API Gateway', status: 'operational', uptime: 99.99, lastCheck: '5m ago' },
  { name: 'Database Primary', status: 'operational', uptime: 99.98, lastCheck: '2m ago' },
  { name: 'Cache Layer', status: 'operational', uptime: 99.95, lastCheck: '1m ago' },
  { name: 'Search Index', status: 'operational', uptime: 99.92, lastCheck: '3m ago' },
  { name: 'Message Queue', status: 'warning', uptime: 98.5, lastCheck: '1m ago' },
  { name: 'CDN', status: 'operational', uptime: 100.0, lastCheck: 'just now' },
];

export default function SystemHealthPage() {
  const avgUptime = (services.reduce((sum, s) => sum + s.uptime, 0) / services.length).toFixed(2);

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">System Health</h1>
        <p className="text-muted-foreground mt-1">Monitor infrastructure performance and availability</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">System Status</p>
            <Activity size={18} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">All Good</p>
          <Badge className="mt-3 bg-emerald-500/10 text-emerald-500">Operational</Badge>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Average Uptime</p>
            <Zap size={18} className="text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{avgUptime}%</p>
          <p className="text-xs text-emerald-500 mt-2">↑ 0.02% vs last week</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
            <Clock size={18} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">145ms</p>
          <p className="text-xs text-emerald-500 mt-2">↓ 12ms vs last week</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Incidents (30d)</p>
            <AlertCircle size={18} className="text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">2</p>
          <p className="text-xs text-muted-foreground mt-2">Last: 3 days ago</p>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="CPU & Memory Usage" description="Last 24 hours">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={systemData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
              <Line type="monotone" dataKey="cpu" stroke="#4F46E5" strokeWidth={2} dot={false} name="CPU %" />
              <Line type="monotone" dataKey="memory" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Request Volume" description="Last 24 hours">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={systemData}>
              <defs>
                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
              <Area type="monotone" dataKey="requests" stroke="#10B981" fill="url(#colorReq)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Services Status */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Service Status</h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Uptime</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Last Check</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.name} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Server size={16} className="text-muted-foreground" />
                        <span className="font-medium text-foreground">{service.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`${
                          service.status === 'operational'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{service.uptime}%</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{service.lastCheck}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Maintenance Schedule */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Maintenance</h2>
        <div className="space-y-3">
          <div className="flex items-start justify-between p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Database Upgrade</p>
              <p className="text-sm text-muted-foreground mt-1">Scheduled for June 5, 2024 2:00 AM - 3:00 AM UTC</p>
              <p className="text-xs text-muted-foreground mt-2">Expected downtime: ~5 minutes</p>
            </div>
            <Badge className="bg-amber-500/10 text-amber-500">Scheduled</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
