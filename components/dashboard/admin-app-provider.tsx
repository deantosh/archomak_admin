'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { AdminApplicationRecord, AdminApplicationsResponse } from '@/lib/admin-app-types'
import { ADMIN_APP_COOKIE_NAME, ADMIN_APP_STORAGE_KEY } from '@/lib/admin-app-selection'

type AdminAppContextValue = {
  apps: AdminApplicationRecord[]
  selectedApp: AdminApplicationRecord | null
  selectedAppKey: string | null
  setSelectedAppKey: (value: string) => void
  loading: boolean
  error: string | null
}

const AdminAppContext = createContext<AdminAppContextValue | null>(null)

function persistSelectedAppKey(value: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ADMIN_APP_STORAGE_KEY, value)
  document.cookie = `${ADMIN_APP_COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
}

function readStoredSelectedAppKey() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ADMIN_APP_STORAGE_KEY)
}

export function AdminAppProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<AdminApplicationRecord[]>([])
  const [selectedAppKey, setSelectedAppKeyState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadApplications() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/admin-applications', { cache: 'no-store' })
        const payload = (await response.json().catch(() => null)) as
          | ({ detail?: string } & Partial<AdminApplicationsResponse>)
          | null

        if (!response.ok) {
          throw new Error(payload?.detail || 'We could not load the connected applications.')
        }

        if (!active) return

        const items = payload?.items || []
        setApps(items)

        if (!items.length) {
          setSelectedAppKeyState(null)
          return
        }

        const storedKey = readStoredSelectedAppKey()
        const nextKey =
          (storedKey && items.find((item) => item.slug === storedKey)?.slug) || items[0].slug

        setSelectedAppKeyState(nextKey)
        persistSelectedAppKey(nextKey)
      } catch (loadError) {
        if (!active) return
        setApps([])
        setSelectedAppKeyState(null)
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'We could not load the connected applications.',
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadApplications()

    return () => {
      active = false
    }
  }, [])

  const selectedApp = useMemo(
    () => apps.find((item) => item.slug === selectedAppKey) ?? apps[0] ?? null,
    [apps, selectedAppKey],
  )

  useEffect(() => {
    if (!selectedApp?.slug) return
    persistSelectedAppKey(selectedApp.slug)
  }, [selectedApp?.slug])

  const value = useMemo<AdminAppContextValue>(
    () => ({
      apps,
      selectedApp,
      selectedAppKey: selectedApp?.slug ?? selectedAppKey,
      setSelectedAppKey: (value: string) => {
        setSelectedAppKeyState(value)
        persistSelectedAppKey(value)
      },
      loading,
      error,
    }),
    [apps, error, loading, selectedApp, selectedAppKey],
  )

  return <AdminAppContext.Provider value={value}>{children}</AdminAppContext.Provider>
}

export function useAdminApp() {
  const context = useContext(AdminAppContext)

  if (!context) {
    throw new Error('useAdminApp must be used within an AdminAppProvider.')
  }

  return context
}
