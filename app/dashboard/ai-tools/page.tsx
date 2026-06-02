'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from '@/components/dashboard/chart-card';
import { getStats } from '@/lib/mock-data';

const aiUsageData = [
  { model: 'GPT-4', usage: 450, cost: 1200 },
  { model: 'Claude 3', usage: 320, cost: 890 },
  { model: 'Gemini', usage: 280, cost: 650 },
  { model: 'Custom Model', usage: 150, cost: 340 },
];

export default function AIToolsPage() {
  const stats = getStats();

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">AI Operations</h1>
        <p className="text-muted-foreground mt-1">Monitor AI model usage and costs</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">AI Requests (30d)</p>
          <p className="text-3xl font-bold text-foreground">1.2M</p>
          <p className="text-xs text-emerald-500 mt-2">↑ 23% vs last month</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Monthly AI Spend</p>
          <p className="text-3xl font-bold text-foreground">$3.2K</p>
          <p className="text-xs text-amber-500 mt-2">⚠️ {stats.aiUsagePercent}% of budget used</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Active Models</p>
          <p className="text-3xl font-bold text-foreground">4</p>
          <p className="text-xs text-muted-foreground mt-2">✓ All operational</p>
        </div>
      </div>

      {/* Model Usage */}
      <ChartCard title="Model Usage & Costs" description="Last 30 days">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={aiUsageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="model" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            <Bar dataKey="usage" fill="#4F46E5" radius={[8, 8, 0, 0]} name="Requests" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Model Details */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Model</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Requests</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Cost</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {aiUsageData.map((item) => (
              <tr key={item.model} className="border-b border-border hover:bg-muted/50">
                <td className="px-6 py-4 font-medium text-foreground">{item.model}</td>
                <td className="px-6 py-4 text-foreground">{item.usage.toLocaleString()}</td>
                <td className="px-6 py-4 font-semibold text-primary">${item.cost.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2" />
                  <span className="text-sm text-emerald-500">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
