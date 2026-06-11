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

type DashboardHeaderProps = {
  user: {
    displayName: string
    email: string
    roleLabel: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
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
        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-md items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <Search size={16} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search…"
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>

          {/* User Menu */}
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
