import 'server-only'

import { PortfolioActivityItem, PortfolioAppSummary, PortfolioOverviewResponse } from '@/lib/admin-portfolio-types'
import {
  KunanyeshaAdminActivityResponse,
  KunanyeshaAdminHealthResponse,
  KunanyeshaAdminSummaryResponse,
} from '@/lib/kunanyesha-admin-types'
import { fetchAdminSource, getAdminAppSources } from '@/lib/server/kunanyesha-admin'

export async function fetchPortfolioOverview(): Promise<PortfolioOverviewResponse> {
  const sources = await getAdminAppSources()

  if (sources.length === 0) {
    throw new Error('No application connections are configured yet.')
  }

  const sourcePayloads = await Promise.allSettled(
    sources.map(async (source) => {
      const [summary, health, activity] = await Promise.all([
        fetchAdminSource<KunanyeshaAdminSummaryResponse>(source, 'summary'),
        fetchAdminSource<KunanyeshaAdminHealthResponse>(source, 'health').catch(() => null),
        fetchAdminSource<KunanyeshaAdminActivityResponse>(source, 'activity').catch(() => ({ items: [] })),
      ])

      const appSummary: PortfolioAppSummary = {
        ...summary,
        source_key: source.key,
        source_label: source.label,
        source_icon: source.icon,
        health,
      }

      const activityItems: PortfolioActivityItem[] = activity.items.map((item) => ({
        ...item,
        source_key: source.key,
        source_label: source.label,
      }))

      return { appSummary, activityItems }
    }),
  )

  const successfulPayloads = sourcePayloads
    .filter((item): item is PromiseFulfilledResult<{ appSummary: PortfolioAppSummary; activityItems: PortfolioActivityItem[] }> => item.status === 'fulfilled')
    .map((item) => item.value)

  if (successfulPayloads.length === 0) {
    const firstFailure = sourcePayloads.find(
      (item): item is PromiseRejectedResult => item.status === 'rejected',
    )
    throw new Error(firstFailure?.reason instanceof Error ? firstFailure.reason.message : 'We could not load live application data right now.')
  }

  const apps = successfulPayloads.map((item) => item.appSummary)
  const activity = sourcePayloads
    .filter((item): item is PromiseFulfilledResult<{ appSummary: PortfolioAppSummary; activityItems: PortfolioActivityItem[] }> => item.status === 'fulfilled')
    .flatMap((item) => item.value.activityItems)
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 12)

  return {
    applications_count: apps.length,
    total_users: apps.reduce((sum, app) => sum + app.users_total, 0),
    total_revenue: apps.reduce((sum, app) => sum + app.completed_payments_total, 0),
    total_reports: apps.reduce((sum, app) => sum + app.reports_total, 0),
    total_uploads: apps.reduce((sum, app) => sum + app.uploads_total, 0),
    total_requests_per_day: apps.reduce((sum, app) => sum + app.app.requests_per_day, 0),
    pending_reports: apps.reduce((sum, app) => sum + app.pending_reports, 0),
    failed_payments_count: apps.reduce((sum, app) => sum + app.failed_payments_count, 0),
    degraded_apps_count: apps.filter(
      (app) => app.app.status !== 'operational' || app.health?.status === 'degraded',
    ).length,
    apps,
    activity,
  }
}
