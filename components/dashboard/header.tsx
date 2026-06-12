'use client';

import { motion } from 'framer-motion';
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
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-0 right-0 left-0 lg:left-[240px] h-14 bg-background/95 border-b border-border z-30 backdrop-blur-sm"
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-sm items-center gap-2.5 bg-card border border-border rounded-lg px-3 py-1.5 hover:border-primary/40 transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search…"
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-auto">

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full ring-1 ring-background" />
          </motion.button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ml-1 w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-semibold text-xs hover:bg-primary/25 transition-colors"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
                aria-label="User menu"
              >
                {initials}
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2 space-y-0.5">
                <p className="font-semibold text-sm text-foreground leading-none">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                  {user.roleLabel}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <Settings size={14} />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Bell size={14} />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-destructive focus:text-destructive gap-2">
                <SignOutButton className="flex w-full items-center" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
