'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockLogs } from '@/lib/mock-data';

const statusColors: Record<number, string> = {
  200: 'bg-emerald-500/10 text-emerald-500',
  201: 'bg-emerald-500/10 text-emerald-500',
  202: 'bg-emerald-500/10 text-emerald-500',
  204: 'bg-emerald-500/10 text-emerald-500',
  400: 'bg-amber-500/10 text-amber-500',
  404: 'bg-amber-500/10 text-amber-500',
  500: 'bg-red-500/10 text-red-500',
};

function getStatusColor(status: number) {
  const group = Math.floor(status / 100) * 100;
  if (status >= 200 && status < 300) return 'bg-emerald-500/10 text-emerald-500';
  if (status >= 400 && status < 500) return 'bg-amber-500/10 text-amber-500';
  if (status >= 500) return 'bg-red-500/10 text-red-500';
  return 'bg-muted text-muted-foreground';
}

export default function LogsPage() {
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);

  const filteredLogs = selectedStatus
    ? mockLogs.filter(log => Math.floor(log.status / 100) * 100 === selectedStatus)
    : mockLogs;

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">API Logs</h1>
          <p className="text-muted-foreground mt-1">View and search API request logs</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 w-full">
          <Search size={16} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
          />
        </div>
        <Button variant="outline">
          <Filter size={18} className="mr-2" />
          Filter
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          All ({mockLogs.length})
        </button>
        <button
          onClick={() => setSelectedStatus(200)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === 200
              ? 'bg-emerald-500 text-white'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Success ({mockLogs.filter(l => l.status >= 200 && l.status < 300).length})
        </button>
        <button
          onClick={() => setSelectedStatus(400)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === 400
              ? 'bg-amber-500 text-white'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Client Error ({mockLogs.filter(l => l.status >= 400 && l.status < 500).length})
        </button>
        <button
          onClick={() => setSelectedStatus(500)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === 500
              ? 'bg-red-500 text-white'
              : 'bg-card border border-border hover:bg-muted'
          }`}
        >
          Server Error ({mockLogs.filter(l => l.status >= 500).length})
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Endpoint</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Latency</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">IP Address</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{formatTime(log.timestamp)}</td>
                  <td className="px-6 py-4 font-mono text-xs text-foreground">{log.endpoint}</td>
                  <td className="px-6 py-4">
                    <Badge className={`font-mono ${getStatusColor(log.status)}`}>{log.status}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono text-xs ${log.latency > 1000 ? 'text-red-500' : 'text-foreground'}`}>
                      {log.latency}ms
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{log.ipAddress}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs font-medium text-muted-foreground hover:text-foreground">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
