export interface KunanyeshaAdminAppSummary {
  key: string
  name: string
  environment: string
  status: string
  users: number
  active_users: number
  revenue: number
  requests_per_day: number
  api_health: number
  last_deployment?: string | null
}

export interface KunanyeshaAdminSummaryResponse {
  app: KunanyeshaAdminAppSummary
  organizations_total: number
  users_total: number
  reports_total: number
  uploads_total: number
  pending_reports: number
  completed_payments_total: number
  pending_payments_total: number
  failed_payments_count: number
}

export interface KunanyeshaAdminActivityItem {
  id: string
  type: string
  severity: string
  message: string
  actor?: string | null
  timestamp: string
  meta?: Record<string, unknown> | null
}

export interface KunanyeshaAdminActivityResponse {
  items: KunanyeshaAdminActivityItem[]
}

export interface KunanyeshaAdminUserItem {
  id: string
  email?: string | null
  full_name?: string | null
  county?: string | null
  organization?: string | null
  job_title?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface KunanyeshaAdminUsersResponse {
  total: number
  items: KunanyeshaAdminUserItem[]
}

export interface KunanyeshaAdminPaymentsSummaryResponse {
  completed_total: number
  pending_total: number
  failed_total: number
  completed_count: number
  pending_count: number
  failed_count: number
}

export interface KunanyeshaAdminPaymentItem {
  id: string
  user_id?: string | null
  email?: string | null
  amount: number
  currency?: string | null
  status: string
  provider?: string | null
  reference?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface KunanyeshaAdminPaymentsResponse {
  total: number
  items: KunanyeshaAdminPaymentItem[]
}

export interface KunanyeshaAdminReportsSummaryResponse {
  total_reports: number
  completed_reports: number
  pending_reports: number
  failed_reports: number
  last_generated_at?: string | null
}

export interface KunanyeshaAdminLogItem {
  id: string
  stage?: string | null
  status?: string | null
  message?: string | null
  created_at: string
  workflow_status_id?: number | null
}

export interface KunanyeshaAdminLogsResponse {
  total: number
  items: KunanyeshaAdminLogItem[]
}

export interface KunanyeshaAdminNotificationItem {
  id: string
  type: string
  severity: string
  title: string
  message: string
  timestamp: string
}

export interface KunanyeshaAdminNotificationsResponse {
  total: number
  items: KunanyeshaAdminNotificationItem[]
}

export interface KunanyeshaAdminSystemHealthServiceItem {
  name: string
  status: string
  detail?: string | null
}

export interface KunanyeshaAdminSystemHealthResponse {
  status: string
  services: KunanyeshaAdminSystemHealthServiceItem[]
  uptime_hint?: string | null
}
