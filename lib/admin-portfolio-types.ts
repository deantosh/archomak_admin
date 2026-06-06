import {
  KunanyeshaAdminActivityItem,
  KunanyeshaAdminHealthResponse,
  KunanyeshaAdminSummaryResponse,
} from '@/lib/kunanyesha-admin-types'

export interface PortfolioAppSummary extends KunanyeshaAdminSummaryResponse {
  source_key: string
  source_label: string
  source_icon?: string
  health?: KunanyeshaAdminHealthResponse | null
}

export interface PortfolioActivityItem extends KunanyeshaAdminActivityItem {
  source_key: string
  source_label: string
}

export interface PortfolioOverviewResponse {
  applications_count: number
  total_users: number
  total_revenue: number
  total_reports: number
  total_uploads: number
  total_requests_per_day: number
  pending_reports: number
  failed_payments_count: number
  degraded_apps_count: number
  apps: PortfolioAppSummary[]
  activity: PortfolioActivityItem[]
}
