export function toUserFriendlyErrorMessage(message?: string | null) {
  const normalized = (message || '').toLowerCase()

  if (!normalized) {
    return 'Something went wrong. Please try again.'
  }

  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Too many requests were made recently. Please wait a few minutes and try again.'
  }

  if (normalized.includes('no connected admin application sources')) {
    return 'No application connections are configured yet. Please finish setup and try again.'
  }

  if (normalized.includes('no admin app sources are configured')) {
    return 'No application connections are configured yet. Please finish setup and try again.'
  }

  if (normalized.includes('application connection is incomplete')) {
    return 'One of the application connections is incomplete. Please finish setup and try again.'
  }

  if (normalized.includes('missing kunanyesha_admin_api_url') || normalized.includes('missing kunanyesha_admin_api_key')) {
    return 'The dashboard connection is incomplete. Please finish setup and try again.'
  }

  if (normalized.includes('missing supabase_service_role_key')) {
    return 'This feature is not fully configured yet. Please contact an administrator.'
  }

  if (normalized.includes('unauthorized')) {
    return 'Your session has expired. Please sign in again.'
  }

  if (normalized.includes('access denied')) {
    return 'You do not have permission to perform this action.'
  }

  if (normalized.includes('no active organization membership')) {
    return 'Your account is not linked to an active team yet. Please contact an administrator.'
  }

  if (normalized.includes('unable to send the invitation email')) {
    return 'We could not send the invitation right now. Please try again shortly.'
  }

  if (normalized.includes('staff profile could not be prepared')) {
    return 'The invitation was sent, but we could not finish preparing the staff account. Please contact support.'
  }

  if (normalized.includes('organization membership could not be saved')) {
    return 'The invitation was sent, but we could not finish linking the team membership. Please contact support.'
  }

  if (normalized.includes('no pending invitation')) {
    return 'This invitation is no longer valid. Please request a new one.'
  }

  if (normalized.includes('official verification')) {
    return 'Official report access is not fully configured yet. Please contact an administrator.'
  }

  if (normalized.includes('work email address')) {
    return 'Enter a valid work email address from an approved organization domain.'
  }

  if (normalized.includes('invalid or has expired')) {
    return 'This link is invalid or has expired. Please request a new one.'
  }

  if (normalized.includes('failed (404)')) {
    return 'We could not reach one of the connected applications. Please check the app connection and try again.'
  }

  if (normalized.includes('failed (500)') || normalized.includes('failed (502)') || normalized.includes('failed (503)')) {
    return 'A connected service is temporarily unavailable. Please try again in a moment.'
  }

  if (normalized.includes('could not load the connected application data right now')) {
    return 'We could not load live application data right now. Please try again in a moment.'
  }

  return message || 'Something went wrong. Please try again.'
}
