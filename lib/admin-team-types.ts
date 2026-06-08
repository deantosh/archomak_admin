export interface AdminTeamMember {
  id: string
  user_id: string
  organization_id: string
  organization_name?: string | null
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  role: string
  status: string
  joined_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface AdminTeamResponse {
  total: number
  items: AdminTeamMember[]
}
