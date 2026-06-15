'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Grid2X2, List, LoaderCircle, Plus, Search } from 'lucide-react'

import { AppCard } from '@/components/dashboard/app-card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminApplicationRecord, AdminApplicationsResponse } from '@/lib/admin-app-types'
import { PortfolioAppSummary, PortfolioOverviewResponse } from '@/lib/admin-portfolio-types'
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

type ViewType = 'grid' | 'list'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isDbApp(app: AdminApplicationRecord) {
  return UUID_RE.test(app.id)
}

function AppLogo({ name, logoUrl, size = 'md' }: { name: string; logoUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16' }
  const textClasses = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' }

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted shrink-0`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-contain p-1" />
      ) : (
        <span className={`${textClasses[size]} font-bold text-muted-foreground select-none`}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

export default function AppsPage() {
  const [viewType, setViewType] = useState<ViewType>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [apps, setApps] = useState<AdminApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [liveMetrics, setLiveMetrics] = useState<Record<string, PortfolioAppSummary>>({})
  const [liveLoading, setLiveLoading] = useState(true)
  const [syncingAppId, setSyncingAppId] = useState<string | null>(null)
  const [globalMessage, setGlobalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  // ── Create dialog ──────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createLogoFile, setCreateLogoFile] = useState<File | null>(null)
  const [createLogoPreview, setCreateLogoPreview] = useState<string | null>(null)
  const [createEnvironment, setCreateEnvironment] = useState('production')
  const [createBaseUrl, setCreateBaseUrl] = useState('')
  const [createApiKey, setCreateApiKey] = useState('')

  // ── Details / edit dialog ──────────────────────────────────────────────────
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsApp, setDetailsApp] = useState<AdminApplicationRecord | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editEnvironment, setEditEnvironment] = useState('production')
  const [editBaseUrl, setEditBaseUrl] = useState('')
  const [editApiKey, setEditApiKey] = useState('')
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)

  async function loadApplications() {
    setLoadError(null)
    setLoading(true)
    try {
      const response = await fetch('/api/admin-applications', { cache: 'no-store' })
      const payload = (await response.json().catch(() => null)) as
        | ({ detail?: string } & Partial<AdminApplicationsResponse>)
        | null
      if (!response.ok) {
        setApps([])
        setLoadError(toUserFriendlyErrorMessage(payload?.detail || 'We could not load the applications right now.'))
        return
      }
      setApps(payload?.items || [])
    } catch {
      setApps([])
      setLoadError('We could not load the applications right now. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  async function loadLiveMetrics() {
    setLiveLoading(true)
    try {
      const response = await fetch('/api/admin-overview', { cache: 'no-store' })
      if (!response.ok) {
        setLiveMetrics({})
        return
      }
      const payload = (await response.json().catch(() => null)) as PortfolioOverviewResponse | null
      const map: Record<string, PortfolioAppSummary> = {}
      for (const app of payload?.apps || []) {
        map[app.source_key] = app
      }
      setLiveMetrics(map)
    } catch {
      setLiveMetrics({})
    } finally {
      setLiveLoading(false)
    }
  }

  useEffect(() => {
    void loadApplications()
    void loadLiveMetrics()
  }, [])

  useEffect(() => {
    return () => {
      if (createLogoPreview) URL.revokeObjectURL(createLogoPreview)
      if (editLogoPreview) URL.revokeObjectURL(editLogoPreview)
    }
  }, [createLogoPreview, editLogoPreview])

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps
    const needle = searchQuery.toLowerCase()
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(needle) ||
        app.slug.toLowerCase().includes(needle) ||
        (app.environment && app.environment.toLowerCase().includes(needle)),
    )
  }, [apps, searchQuery])

  function normalizeSlug(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  // ── Create handlers ────────────────────────────────────────────────────────
  function handleCreateLogoChange(file: File | null) {
    setCreateLogoFile(file)
    if (createLogoPreview) URL.revokeObjectURL(createLogoPreview)
    setCreateLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleCreateApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateError(null)
    setCreateSuccess(null)
    setCreateLoading(true)

    try {
      let uploadedLogoUrl: string | null = null

      if (createLogoFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', createLogoFile)
        uploadFormData.append('slug', createSlug || normalizeSlug(createName))
        const uploadResponse = await fetch('/api/admin-applications/logo', { method: 'POST', body: uploadFormData })
        const uploadPayload = (await uploadResponse.json().catch(() => null)) as { detail?: string; logoUrl?: string } | null
        if (!uploadResponse.ok || !uploadPayload?.logoUrl) {
          setCreateError(toUserFriendlyErrorMessage(uploadPayload?.detail || 'We could not upload the logo right now.'))
          return
        }
        uploadedLogoUrl = uploadPayload.logoUrl
      }

      const response = await fetch('/api/admin-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName,
          slug: createSlug || normalizeSlug(createName),
          description: createDescription,
          logoUrl: uploadedLogoUrl,
          environment: createEnvironment,
          baseUrl: createBaseUrl,
          apiKey: createApiKey,
        }),
      })
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null
      if (!response.ok) {
        setCreateError(toUserFriendlyErrorMessage(payload?.detail || 'We could not add the application right now.'))
        return
      }
      setCreateSuccess(payload?.detail || `${createName} has been added successfully.`)
      setCreateName('')
      setCreateSlug('')
      setCreateDescription('')
      setCreateLogoFile(null)
      setCreateLogoPreview(null)
      setCreateEnvironment('production')
      setCreateBaseUrl('')
      setCreateApiKey('')
      await loadApplications()
    } catch {
      setCreateError('We could not add the application right now. Please try again shortly.')
    } finally {
      setCreateLoading(false)
    }
  }

  // ── Sync handler ───────────────────────────────────────────────────────────
  async function handleSyncApplication(appId: string) {
    setGlobalMessage(null)
    setSyncingAppId(appId)
    try {
      const response = await fetch(`/api/admin-applications/${appId}/sync`, { method: 'POST' })
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null
      if (!response.ok) {
        setGlobalMessage({ type: 'error', text: toUserFriendlyErrorMessage(payload?.detail || 'We could not sync this application right now.') })
        return
      }
      setGlobalMessage({ type: 'success', text: payload?.detail || 'Application metrics synced successfully.' })
      await Promise.all([loadApplications(), loadLiveMetrics()])
    } catch {
      setGlobalMessage({ type: 'error', text: 'We could not sync this application right now. Please try again shortly.' })
    } finally {
      setSyncingAppId(null)
    }
  }

  // ── Details / edit handlers ────────────────────────────────────────────────
  function handleViewDetails(appId: string) {
    const app = apps.find((a) => a.id === appId)
    if (!app) return
    setDetailsApp(app)
    setEditMode(false)
    setEditName(app.name)
    setEditDescription(app.description ?? '')
    setEditEnvironment(app.environment)
    setEditBaseUrl(app.connection.base_url ?? '')
    setEditApiKey('')
    setEditLogoFile(null)
    setEditLogoPreview(null)
    setShowApiKey(false)
    setEditError(null)
    setEditSuccess(null)
    setDetailsOpen(true)
  }

  function handleEditLogoChange(file: File | null) {
    setEditLogoFile(file)
    if (editLogoPreview) URL.revokeObjectURL(editLogoPreview)
    setEditLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detailsApp) return
    setEditError(null)
    setEditSuccess(null)
    setEditLoading(true)

    try {
      let uploadedLogoUrl: string | undefined = undefined

      if (editLogoFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', editLogoFile)
        uploadFormData.append('slug', detailsApp.slug)
        const uploadResponse = await fetch('/api/admin-applications/logo', { method: 'POST', body: uploadFormData })
        const uploadPayload = (await uploadResponse.json().catch(() => null)) as { detail?: string; logoUrl?: string } | null
        if (!uploadResponse.ok || !uploadPayload?.logoUrl) {
          setEditError(toUserFriendlyErrorMessage(uploadPayload?.detail || 'We could not upload the logo right now.'))
          return
        }
        uploadedLogoUrl = uploadPayload.logoUrl
      }

      const body: Record<string, unknown> = {
        name: editName,
        description: editDescription || null,
        environment: editEnvironment,
        baseUrl: editBaseUrl,
      }
      if (editApiKey) body.apiKey = editApiKey
      if (uploadedLogoUrl !== undefined) body.logoUrl = uploadedLogoUrl

      const response = await fetch(`/api/admin-applications/${detailsApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = (await response.json().catch(() => null)) as { detail?: string } | null
      if (!response.ok) {
        setEditError(toUserFriendlyErrorMessage(payload?.detail || 'We could not update the application right now.'))
        return
      }
      setEditSuccess(payload?.detail || 'Application updated successfully.')
      setEditMode(false)
      await loadApplications()
      const updated = apps.find((a) => a.id === detailsApp.id)
      if (updated) setDetailsApp(updated)
    } catch {
      setEditError('We could not update the application right now. Please try again shortly.')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="text-muted-foreground mt-1">Manage your digital products and services</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus size={18} className="mr-2" />
          New Application
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-card border border-border rounded-lg px-3 py-2">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shrink-0">
          <button
            onClick={() => setViewType('grid')}
            className={`p-2 rounded-md transition-colors ${viewType === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-label="Grid view"
          >
            <Grid2X2 size={18} />
          </button>
          <button
            onClick={() => setViewType('list')}
            className={`p-2 rounded-md transition-colors ${viewType === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            aria-label="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {loading ? 'Loading applications...' : `Showing ${filteredApps.length} application${filteredApps.length !== 1 ? 's' : ''}`}
        </span>
        {!loading && liveLoading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
            <LoaderCircle className="size-3 animate-spin" />
            Live data loading…
          </span>
        )}
      </div>

      {loadError && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {loadError}
        </div>
      )}

      {globalMessage && (
        <div className={`rounded-lg px-3 py-2 text-sm ${globalMessage.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {globalMessage.text}
        </div>
      )}

      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => {
            const live = liveMetrics[app.slug]
            return (
              <AppCard
                key={app.id}
                id={app.id}
                name={app.name}
                logoUrl={app.logo_url}
                status={app.status === 'operational' ? 'operational' : app.status === 'warning' ? 'warning' : 'critical'}
                environment={app.environment === 'staging' ? 'staging' : 'production'}
                users={live?.users_total ?? app.total_users}
                apiHealth={live?.app.api_health ?? app.api_health ?? 0}
                requests={live?.app.requests_per_day ?? app.requests_per_day}
                revenue={live?.completed_payments_total ?? app.monthly_revenue}
                lastDeployment={live?.app.last_deployment ?? app.last_deployment_at ?? null}
                activeUsers={live?.app.active_users ?? app.active_users}
                syncLoading={syncingAppId === app.id}
                onSync={handleSyncApplication}
                onViewDetails={handleViewDetails}
              />
            )
          })}
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
                {filteredApps.map((app) => {
                  const live = liveMetrics[app.slug]
                  const users = live?.users_total ?? app.total_users
                  const apiHealth = live?.app.api_health ?? app.api_health ?? 0
                  const revenue = live?.completed_payments_total ?? app.monthly_revenue
                  return (
                  <tr key={app.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted shrink-0">
                          {app.logo_url ? (
                            <img src={app.logo_url} alt={`${app.name} logo`} className="h-full w-full object-contain p-0.5" />
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">{app.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{app.name}</p>
                          <p className="text-xs text-muted-foreground">{app.environment}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${app.status === 'operational' ? 'bg-emerald-500/10 text-emerald-500' : app.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{users.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{apiHealth}%</td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">${revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(app.id)}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleSyncApplication(app.id)} disabled={syncingAppId === app.id}>
                          {syncingAppId === app.id ? 'Syncing…' : 'Sync'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !loadError && filteredApps.length === 0 && (
        <div className="text-sm text-muted-foreground">No applications available yet.</div>
      )}

      {/* ── Create Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
            <DialogDescription>
              Register a new product and its admin API connection so it can appear in the central dashboard.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateApp}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-name">Application Name</Label>
                <Input id="create-name" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Kunanyesha" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">Slug</Label>
                <Input id="create-slug" value={createSlug} onChange={(e) => setCreateSlug(e.target.value)} placeholder="kunanyesha" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-environment">Environment</Label>
                <select
                  id="create-environment"
                  value={createEnvironment}
                  onChange={(e) => setCreateEnvironment(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-logo-file">Logo</Label>
                <Input id="create-logo-file" type="file" accept="image/*" onChange={(e) => handleCreateLogoChange(e.target.files?.[0] || null)} />
              </div>
            </div>

            {createLogoPreview && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <img src={createLogoPreview} alt="Logo preview" className="h-10 w-10 rounded-lg object-contain" />
                <p className="text-sm text-muted-foreground">Logo will be uploaded when you save.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Input id="create-description" value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Brief description of this application." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-base-url">Admin API Base URL</Label>
              <Input id="create-base-url" type="url" value={createBaseUrl} onChange={(e) => setCreateBaseUrl(e.target.value)} placeholder="https://your-app.up.railway.app/api/v1/admin" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-api-key">API Key</Label>
              <Input id="create-api-key" type="password" value={createApiKey} onChange={(e) => setCreateApiKey(e.target.value)} placeholder="Service key or shared admin token" required />
            </div>

            {(createError || createSuccess) && (
              <div className={`rounded-lg px-3 py-2 text-sm ${createError ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {createError || createSuccess}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setCreateError(null); setCreateSuccess(null) }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Saving...</> : 'Save Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Details / Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={detailsOpen} onOpenChange={(open) => { setDetailsOpen(open); if (!open) setEditMode(false) }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailsApp && (() => {
            const live = liveMetrics[detailsApp.slug]
            const liveStatus = live?.app.status ?? detailsApp.status
            const liveUsers = live?.users_total ?? detailsApp.total_users
            const liveActiveUsers = live?.app.active_users ?? detailsApp.active_users
            const liveHealth = live?.app.api_health ?? detailsApp.api_health ?? 0
            const liveRevenue = live?.completed_payments_total ?? detailsApp.monthly_revenue
            const liveRequests = live?.app.requests_per_day
            const liveLastDeploy = live?.app.last_deployment
            const liveReports = live?.reports_total
            const livePendingReports = live?.pending_reports

            return (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <AppLogo name={detailsApp.name} logoUrl={editLogoPreview ?? detailsApp.logo_url} size="lg" />
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-xl">{detailsApp.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${liveStatus === 'operational' ? 'bg-emerald-500/10 text-emerald-500' : liveStatus === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                        {liveStatus.charAt(0).toUpperCase() + liveStatus.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{detailsApp.environment}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-mono text-muted-foreground">{detailsApp.slug}</span>
                      {liveLoading && !live && (
                        <LoaderCircle size={12} className="animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {!isDbApp(detailsApp) && (
                <div className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                  This application is configured via environment variables and cannot be edited here.
                </div>
              )}

              {/* Live Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Users', value: liveUsers.toLocaleString() },
                  { label: 'Active Users', value: liveActiveUsers.toLocaleString() },
                  { label: 'API Health', value: `${liveHealth}%`, highlight: liveHealth > 98 ? 'emerald' : 'amber' },
                  { label: 'Revenue', value: `$${liveRevenue.toLocaleString()}` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className={`font-semibold text-sm ${stat.highlight === 'emerald' ? 'text-emerald-500' : stat.highlight === 'amber' ? 'text-amber-500' : 'text-foreground'}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {editMode && isDbApp(detailsApp) ? (
                /* ── Edit form ──────────────────────────────────────────── */
                <form className="space-y-4" onSubmit={handleSaveEdit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Name</Label>
                      <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-environment">Environment</Label>
                      <select
                        id="edit-environment"
                        value={editEnvironment}
                        onChange={(e) => setEditEnvironment(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                      >
                        <option value="production">Production</option>
                        <option value="staging">Staging</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Input id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Brief description" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-logo">Logo</Label>
                    <Input id="edit-logo" type="file" accept="image/*" onChange={(e) => handleEditLogoChange(e.target.files?.[0] || null)} />
                    {editLogoPreview && (
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                        <img src={editLogoPreview} alt="Logo preview" className="h-10 w-10 rounded-lg object-contain" />
                        <p className="text-sm text-muted-foreground">New logo will be uploaded when you save.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-base-url">Admin API Base URL</Label>
                    <Input id="edit-base-url" type="url" value={editBaseUrl} onChange={(e) => setEditBaseUrl(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-api-key">API Key <span className="text-muted-foreground font-normal">(leave blank to keep current)</span></Label>
                    <Input id="edit-api-key" type="password" value={editApiKey} onChange={(e) => setEditApiKey(e.target.value)} placeholder="Enter new key to replace" />
                  </div>

                  {(editError || editSuccess) && (
                    <div className={`rounded-lg px-3 py-2 text-sm ${editError ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {editError || editSuccess}
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setEditMode(false); setEditError(null); setEditSuccess(null) }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={editLoading}>
                      {editLoading ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Saving...</> : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                /* ── Read-only view ─────────────────────────────────────── */
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Details</h3>
                    <div className="rounded-xl border border-border divide-y divide-border">
                      {[
                        { label: 'Name', value: detailsApp.name },
                        { label: 'Slug', value: detailsApp.slug, mono: true },
                        { label: 'Description', value: detailsApp.description || '—' },
                        { label: 'Environment', value: detailsApp.environment.charAt(0).toUpperCase() + detailsApp.environment.slice(1) },
                        ...(liveRequests != null ? [{ label: 'Req / Day', value: liveRequests.toLocaleString() }] : []),
                        ...(liveReports != null ? [{ label: 'Reports', value: `${liveReports.toLocaleString()}${livePendingReports ? ` (${livePendingReports} pending)` : ''}` }] : []),
                        ...(liveLastDeploy ? [{ label: 'Last Deploy', value: new Date(liveLastDeploy).toLocaleString() }] : []),
                      ].map((row) => (
                        <div key={row.label} className="flex items-start justify-between px-4 py-3 gap-4">
                          <p className="text-sm text-muted-foreground shrink-0 w-28">{row.label}</p>
                          <p className={`text-sm text-foreground text-right ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Connection</h3>
                    <div className="rounded-xl border border-border divide-y divide-border">
                      <div className="flex items-start justify-between px-4 py-3 gap-4">
                        <p className="text-sm text-muted-foreground shrink-0 w-28">Base URL</p>
                        <p className="text-sm font-mono text-foreground text-right break-all">{detailsApp.connection.base_url || '—'}</p>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <p className="text-sm text-muted-foreground shrink-0 w-28">API Key</p>
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-mono text-foreground truncate">
                            {showApiKey ? (detailsApp.connection.api_key || '—') : '••••••••••••••••••••'}
                          </p>
                          <button onClick={() => setShowApiKey((v) => !v)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-start justify-between px-4 py-3 gap-4">
                        <p className="text-sm text-muted-foreground shrink-0 w-28">Auth Type</p>
                        <p className="text-sm text-foreground">{detailsApp.connection.auth_type || 'Bearer'}</p>
                      </div>
                    </div>
                  </div>

                  {editSuccess && (
                    <div className="rounded-lg px-3 py-2 text-sm bg-emerald-500/10 text-emerald-500">
                      {editSuccess}
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" onClick={() => handleSyncApplication(detailsApp.id)} disabled={syncingAppId === detailsApp.id}>
                      {syncingAppId === detailsApp.id ? 'Syncing…' : 'Sync Now'}
                    </Button>
                    {isDbApp(detailsApp) && (
                      <Button onClick={() => { setEditMode(true); setEditError(null); setEditSuccess(null) }}>
                        Edit
                      </Button>
                    )}
                  </DialogFooter>
                </>
              )}
            </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
