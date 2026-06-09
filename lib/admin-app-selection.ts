export const ADMIN_APP_STORAGE_KEY = 'archomak_admin_selected_app'
export const ADMIN_APP_COOKIE_NAME = 'archomak_admin_selected_app'

export function buildAdminAppApiPath(path: string) {
  return `/api/admin-app/${path.replace(/^\/+/, '')}`
}
