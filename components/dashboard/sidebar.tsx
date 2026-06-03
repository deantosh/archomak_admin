'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  CreditCard,
  FileText,
  Activity,
  Bell,
  Zap,
  Code,
  Settings,
  Heart,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Applications', href: '/dashboard/apps', icon: <Package size={20} /> },
  { name: 'Analytics', href: '/dashboard/analytics', icon: <BarChart3 size={20} /> },
  { name: 'Users', href: '/dashboard/users', icon: <Users size={20} /> },
  { name: 'Payments', href: '/dashboard/payments', icon: <CreditCard size={20} /> },
  { name: 'Reports', href: '/dashboard/reports', icon: <FileText size={20} /> },
  { name: 'Logs', href: '/dashboard/logs', icon: <Activity size={20} /> },
  { name: 'Notifications', href: '/dashboard/notifications', icon: <Bell size={20} />, badge: '3' },
  { name: 'AI Tools', href: '/dashboard/ai-tools', icon: <Zap size={20} /> },
  { name: 'System Health', href: '/dashboard/system-health', icon: <Heart size={20} /> },
  { name: 'Developer', href: '/dashboard/developer', icon: <Code size={20} /> },
  { name: 'Settings', href: '/dashboard/settings', icon: <Settings size={20} /> },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40
          ${isOpen ? 'w-64' : 'w-20'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Image src="/icon.svg" alt="Archomak logo" width={24} height={24} />
            </div>
            <div className={`transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'} ${isOpen ? 'block' : 'hidden'}`}>
              <p className="text-sm font-semibold text-white">Archomak</p>
              <p className="text-[11px] text-sidebar-foreground/60">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => isMobileOpen && setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                      ${isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {isOpen && (
                      <>
                        <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                        {item.badge && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                            ${isActive ? 'bg-sidebar-primary-foreground text-sidebar-primary' : 'bg-sidebar-accent text-sidebar-foreground'}
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Info */}
        <div className={`border-t border-sidebar-border p-4 ${isOpen ? 'block' : 'hidden'}`}>
          <div className="text-xs text-sidebar-foreground/60 text-center">
            <p className="font-medium">Archomak</p>
            <p>Admin Dashboard</p>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Spacer for fixed sidebar */}
      <div className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} hidden lg:block`} />
    </>
  );
}
