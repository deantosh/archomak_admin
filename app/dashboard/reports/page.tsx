'use client';

import { Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartCard } from '@/components/dashboard/chart-card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockAnalyticsData } from '@/lib/mock-data';

const reportTypes = [
  { title: 'Monthly Performance', description: 'Revenue, users, and API metrics', icon: '📊' },
  { title: 'User Analytics', description: 'Detailed user growth and engagement', icon: '👥' },
  { title: 'API Health', description: 'Request volume, latency, and errors', icon: '🔌' },
  { title: 'Payment Summary', description: 'Transaction history and reconciliation', icon: '💳' },
  { title: 'Security Report', description: 'Access logs and security events', icon: '🔐' },
  { title: 'AI Usage', description: 'AI request costs and model usage', icon: '🤖' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and download custom reports</p>
        </div>
        <Button>
          <Download size={18} className="mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Report Types */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-200 cursor-pointer hover:shadow-lg"
            >
              <div className="text-3xl mb-3">{report.icon}</div>
              <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button variant="outline" size="sm" className="w-full">
                Generate
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Reports</h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Generated</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Period</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'May 2024 Performance Report', date: 'May 31, 2024', period: 'May 1-31, 2024' },
                  { name: 'Q2 2024 Summary', date: 'Jun 1, 2024', period: 'Apr-Jun 2024' },
                  { name: 'User Analytics - May', date: 'May 30, 2024', period: 'May 1-31, 2024' },
                  { name: 'API Health Report', date: 'May 28, 2024', period: 'May 21-28, 2024' },
                ].map((report, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{report.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{report.date}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{report.period}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-medium text-primary hover:text-primary/80">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <ChartCard title="Performance Over Time" description="Last 30 days">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockAnalyticsData.daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
