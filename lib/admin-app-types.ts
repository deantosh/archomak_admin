export interface AdminApplicationRecord {
  id: string
  organization_id?: string | null
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  logo_url?: string | null
  status: string
  environment: string
  api_health?: number | null
  uptime?: number | null
  active_users: number
  total_users: number
  requests_per_day: number
  monthly_revenue: number
  last_deployment_at?: string | null
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  connection: {
    base_url?: string | null
    auth_type?: string | null
    api_key?: string | null
    enabled: boolean
    health_path?: string | null
  }
}

export interface AdminApplicationsResponse {
  total: number
  items: AdminApplicationRecord[]
}
