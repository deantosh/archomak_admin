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
        <div className="hidden md:flex flex-1 items-center gap-3">
          <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search apps, users, logs..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>

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
