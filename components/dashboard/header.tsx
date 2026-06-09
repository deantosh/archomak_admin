'use client';

import { Bell, Search, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { useAdminApp } from '@/components/dashboard/admin-app-provider';

type DashboardHeaderProps = {
  user: {
    displayName: string
    email: string
    roleLabel: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { apps, error, loading, selectedAppKey, setSelectedAppKey } = useAdminApp()
  const initials = user.displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || 'AA'

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-card border-b border-border z-30">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="hidden md:flex flex-1 items-center gap-3">
          <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search apps, users, logs..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="min-w-[220px] rounded-xl border border-border bg-card px-3 py-2">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Active Application
            </p>
            <select
              value={selectedAppKey ?? ''}
              onChange={(event) => setSelectedAppKey(event.target.value)}
              disabled={loading || apps.length === 0}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            >
              {loading && <option value="">Loading applications…</option>}
              {!loading && apps.length === 0 && (
                <option value="">{error || 'No applications connected'}</option>
              )}
              {apps.map((app) => (
                <option key={app.id} value={app.slug}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors font-semibold text-sm">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-semibold text-foreground">{user.displayName}</p>
                <p className="text-muted-foreground text-xs">{user.email}</p>
                <p className="text-muted-foreground text-xs">{user.roleLabel}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings size={16} className="mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell size={16} className="mr-2" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                <SignOutButton className="flex w-full items-center" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
