'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Grid2X2, List, LoaderCircle, Plus, Search } from 'lucide-react'

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
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors'

type ViewType = 'grid' | 'list'

export default function AppsPage() {
  const [viewType, setViewType] = useState<ViewType>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [apps, setApps] = useState<AdminApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [syncingAppId, setSyncingAppId] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📦')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [environment, setEnvironment] = useState('production')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

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
        setLoadError(
          toUserFriendlyErrorMessage(payload?.detail || 'We could not load the applications right now.'),
        )
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

  useEffect(() => {
    void loadApplications()
  }, [])

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl)
      }
    }
  }, [logoPreviewUrl])

  const filteredApps = useMemo(
    () =>
      apps.filter((app) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [apps, searchQuery],
  )

  function normalizeSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async function handleCreateApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateError(null)
    setCreateSuccess(null)
    setCreateLoading(true)

    try {
      let uploadedLogoUrl: string | null = null

      if (logoFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', logoFile)
        uploadFormData.append('slug', slug || normalizeSlug(name))

        const uploadResponse = await fetch('/api/admin-applications/logo', {
          method: 'POST',
          body: uploadFormData,
        })

        const uploadPayload = (await uploadResponse.json().catch(() => null)) as
          | { detail?: string; logoUrl?: string }
          | null

        if (!uploadResponse.ok || !uploadPayload?.logoUrl) {
          setCreateError(
            toUserFriendlyErrorMessage(
              uploadPayload?.detail || 'We could not upload the logo right now.',
            ),
          )
          return
        }

        uploadedLogoUrl = uploadPayload.logoUrl
      }

      const response = await fetch('/api/admin-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug: slug || normalizeSlug(name),
          description,
          icon,
          logoUrl: uploadedLogoUrl,
          environment,
          baseUrl,
          apiKey,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { detail?: string }
        | null

      if (!response.ok) {
        setCreateError(
          toUserFriendlyErrorMessage(payload?.detail || 'We could not add the application right now.'),
        )
        return
      }

      setCreateSuccess(payload?.detail || `${name} has been added successfully.`)
      setName('')
      setSlug('')
      setDescription('')
      setIcon('📦')
      setLogoFile(null)
      setLogoPreviewUrl(null)
      setEnvironment('production')
      setBaseUrl('')
      setApiKey('')
      await loadApplications()
    } catch {
      setCreateError('We could not add the application right now. Please try again shortly.')
    } finally {
      setCreateLoading(false)
    }
  }

  function handleLogoChange(file: File | null) {
    setLogoFile(file)
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl)
    }
    setLogoPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleSyncApplication(appId: string) {
    setCreateError(null)
    setCreateSuccess(null)
    setSyncingAppId(appId)

    try {
      const response = await fetch(`/api/admin-applications/${appId}/sync`, {
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as
        | { detail?: string }
        | null

      if (!response.ok) {
        setCreateError(
          toUserFriendlyErrorMessage(payload?.detail || 'We could not sync this application right now.'),
        )
        return
      }

      setCreateSuccess(payload?.detail || 'Application metrics synced successfully.')
      await loadApplications()
    } catch {
      setCreateError('We could not sync this application right now. Please try again shortly.')
    } finally {
      setSyncingAppId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="text-muted-foreground mt-1">Manage your digital products and services</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
          <Plus size={18} className="mr-2" />
          New Application
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      <div className="text-sm text-muted-foreground">
        {loading
          ? 'Loading applications...'
          : `Showing ${filteredApps.length} application${filteredApps.length !== 1 ? 's' : ''}`}
      </div>

      {loadError && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {loadError}
        </div>
      )}

      {(createError || createSuccess) && !dialogOpen && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            createError
              ? 'bg-red-500/10 text-red-500'
              : 'bg-emerald-500/10 text-emerald-500'
          }`}
        >
          {createError || createSuccess}
        </div>
      )}

      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              id={app.id}
              name={app.name}
              icon={app.icon || '📦'}
              logoUrl={app.logo_url}
              status={
                app.status === 'operational'
                  ? 'operational'
                  : app.status === 'warning'
                    ? 'warning'
                    : 'critical'
              }
              environment={app.environment === 'staging' ? 'staging' : 'production'}
              users={app.total_users}
              apiHealth={app.api_health ?? 0}
              requests={app.requests_per_day}
              revenue={app.monthly_revenue}
              lastDeployment={app.last_deployment_at || new Date().toISOString()}
              activeUsers={app.active_users}
              syncLoading={syncingAppId === app.id}
              onSync={handleSyncApplication}
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
                  <th className="px-6 py-3 text-right text-xs font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
                          {app.logo_url ? (
                            <img src={app.logo_url} alt={`${app.name} logo`} className="max-h-7 max-w-7 object-contain" />
                          ) : (
                            <span className="text-xl">{app.icon || '📦'}</span>
                          )}
                        </div>
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
                    <td className="px-6 py-4 text-sm text-foreground">{app.total_users.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{app.api_health ?? 0}%</td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">${app.monthly_revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncApplication(app.id)}
                        disabled={syncingAppId === app.id}
                      >
                        {syncingAppId === app.id ? 'Syncing…' : 'Sync now'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !loadError && filteredApps.length === 0 && (
        <div className="text-sm text-muted-foreground">No applications available yet.</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                <Label htmlFor="app-name">Application Name</Label>
                <Input id="app-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Kunanyesha" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-slug">Slug</Label>
                <Input id="app-slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="kunanyesha" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="app-icon">Icon</Label>
                <Input id="app-icon" value={icon} onChange={(event) => setIcon(event.target.value)} placeholder="📦" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-environment">Environment</Label>
                <select
                  id="app-environment"
                  value={environment}
                  onChange={(event) => setEnvironment(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-description">Description</Label>
              <Input
                id="app-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Operational insights for climate-smart agriculture."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-logo-file">Product Logo</Label>
              <Input
                id="app-logo-file"
                type="file"
                accept="image/*"
                onChange={(event) => handleLogoChange(event.target.files?.[0] || null)}
              />
              {logoPreviewUrl && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <img src={logoPreviewUrl} alt="Selected product logo preview" className="h-12 w-12 rounded-lg object-cover" />
                  <p className="text-sm text-muted-foreground">Logo ready to upload when you save the application.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-base-url">Admin API Base URL</Label>
              <Input
                id="app-base-url"
                type="url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://your-app.up.railway.app/api/v1/admin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="app-api-key">API Key</Label>
              <Input
                id="app-api-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Service key or shared admin token"
                required
              />
            </div>

            {(createError || createSuccess) && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  createError
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}
              >
                {createError || createSuccess}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setCreateError(null)
                  setCreateSuccess(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Application'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
