'use client';

import { useEffect, useState } from 'react';
import { Search, Grid2X2, List, Plus } from 'lucide-react';
import { AppCard } from '@/components/dashboard/app-card';
import { Button } from '@/components/ui/button';
import { PortfolioOverviewResponse } from '@/lib/admin-portfolio-types';

type ViewType = 'grid' | 'list';

export default function AppsPage() {
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [overview, setOverview] = useState<PortfolioOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch('/api/admin-overview', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOverview(data))
      .finally(() => setLoading(false))
  }, [])

  const apps = overview
    ? overview.apps.map((app) => ({
        id: app.source_key,
        name: app.app.name,
        icon: app.source_icon || '📦',
        status:
          app.app.status === 'operational'
            ? 'operational'
            : app.app.status === 'warning'
              ? 'warning'
              : 'critical',
        environment:
          app.app.environment === 'staging' ? 'staging' : 'production',
        users: app.users_total,
        apiHealth: app.app.api_health,
        requestsPerDay: app.app.requests_per_day,
        revenue: app.completed_payments_total,
        lastDeployment: app.app.last_deployment || new Date().toISOString(),
        activeUsers: app.app.active_users,
      }))
    : [];

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Applications</h1>
          <p className="text-muted-foreground mt-1">Manage your digital products and services</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          New Application
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="w-full sm:w-auto flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
          <Search size={16} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <button
            onClick={() => setViewType('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewType === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Grid view"
          >
            <Grid2X2 size={18} />
          </button>
          <button
            onClick={() => setViewType('list')}
            className={`p-2 rounded-md transition-colors ${
              viewType === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''}
      </div>

      {/* Apps Grid/List */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              name={app.name}
              icon={app.icon}
              status={app.status as any}
              environment={app.environment as any}
              users={app.users}
              apiHealth={app.apiHealth}
              requests={app.requestsPerDay}
              revenue={app.revenue}
              lastDeployment={app.lastDeployment}
              activeUsers={app.activeUsers}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Application</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">API Health</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{app.icon}</span>
                        <div>
                          <p className="font-medium text-foreground">{app.name}</p>
                          <p className="text-xs text-muted-foreground">{app.environment}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          app.status === 'operational'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : app.status === 'warning'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{(app.users / 1000).toFixed(1)}K</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              app.apiHealth > 98 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${app.apiHealth}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">{app.apiHealth}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">${(app.revenue / 1000).toFixed(1)}K</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-muted-foreground hover:text-foreground text-sm font-medium">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && filteredApps.length === 0 && (
        <div className="text-sm text-muted-foreground">No applications available yet.</div>
      )}
    </div>
  );
}
