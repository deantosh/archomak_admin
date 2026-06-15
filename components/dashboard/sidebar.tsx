'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Code,
  CreditCard,
  FileText,
  Heart,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV: SidebarItem[] = [
  { name: 'Dashboard',     href: '/dashboard',              icon: LayoutDashboard },
  { name: 'Applications',  href: '/dashboard/apps',         icon: Package },
  { name: 'Analytics',     href: '/dashboard/analytics',    icon: BarChart3 },
  { name: 'Users',         href: '/dashboard/users',        icon: Users },
  { name: 'Payments',      href: '/dashboard/payments',     icon: CreditCard },
  { name: 'Reports',       href: '/dashboard/reports',      icon: FileText },
  { name: 'Logs',          href: '/dashboard/logs',         icon: Activity },
  { name: 'Notifications', href: '/dashboard/notifications',icon: Bell, badge: '3' },
  { name: 'AI Tools',      href: '/dashboard/ai-tools',     icon: Zap },
  { name: 'System Health', href: '/dashboard/system-health',icon: Heart },
  { name: 'Developer',     href: '/dashboard/developer',    icon: Code },
  { name: 'Settings',      href: '/dashboard/settings',     icon: Settings },
];

const sidebarVariants = {
  open:   { width: 240 },
  closed: { width: 72 },
};

const itemVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.25, ease: 'easeOut' },
  }),
};

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileOpen((v) => !v)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border text-foreground hover:bg-accent transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial="open"
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 flex flex-col overflow-hidden
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          <AnimatePresence initial={false} mode="wait">
            {isOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 min-w-0"
              >
                <Image src="/logo.svg" alt="Archomak" width={108} height={28} className="shrink-0" />
              </motion.div>
            ) : (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="shrink-0"
              >
                <Image src="/icon.png" alt="Archomak" width={32} height={32} className="w-8 h-8" />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsOpen((v) => !v)}
            className="hidden lg:flex p-1 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-0.5">
            {NAV.map((item, i) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <motion.li key={item.href} custom={i} variants={itemVariants} initial="hidden" animate="visible">
                  <Link
                    href={item.href}
                    onClick={() => isMobileOpen && setIsMobileOpen(false)}
                    title={!isOpen ? item.name : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 group
                      ${isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      }`}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}

                    <Icon size={18} className="shrink-0" />

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="flex-1 truncate overflow-hidden whitespace-nowrap leading-none"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <AnimatePresence initial={false}>
                      {isOpen && item.badge && (
                        <motion.span
                          key="badge"
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ duration: 0.15 }}
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                            isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                          }`}
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-4 py-3 border-t border-sidebar-border shrink-0"
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 select-none"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Archomak · Admin
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop spacer */}
      <motion.div
        animate={isOpen ? { width: 240 } : { width: 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:block shrink-0"
      />
    </>
  );
}
