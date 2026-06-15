'use client'

import { ChevronDown } from 'lucide-react'

import { useAdminApp } from '@/components/dashboard/admin-app-provider'

function AppLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  return (
    <span className="flex h-4 w-4 items-center justify-center overflow-hidden rounded border border-border bg-muted shrink-0">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-contain" />
      ) : (
        <span className="text-[8px] font-bold text-muted-foreground leading-none select-none">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  )
}

export function AppPicker({ className, label = 'Viewing' }: { className?: string; label?: string }) {
  const { apps, selectedApp, selectedAppKey, setSelectedAppKey, loading, error } = useAdminApp()

  if (loading) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 ${className ?? ''}`}
      >
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (error || apps.length === 0) {
    return null
  }

  const current = selectedApp ?? apps[0]
  const multiple = apps.length > 1

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm ${className ?? ''}`}
    >
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <AppLogo name={current.name} logoUrl={current.logo_url} />
      {multiple ? (
        <div className="relative inline-flex items-center">
          <select
            value={selectedAppKey ?? current.slug}
            onChange={(event) => setSelectedAppKey(event.target.value)}
            className="appearance-none bg-transparent pr-5 font-medium text-foreground outline-none cursor-pointer"
            aria-label="Select application"
          >
            {apps.map((app) => (
              <option key={app.id} value={app.slug}>
                {app.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-0 text-muted-foreground" />
        </div>
      ) : (
        <span className="font-medium text-foreground">{current.name}</span>
      )}
    </div>
  )
}
