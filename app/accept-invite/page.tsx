import { AcceptInviteForm } from '@/components/auth/accept-invite-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const dynamic = 'force-dynamic'

export default function AcceptInvitePage() {
  return (
    <AuthShell>
      <AcceptInviteForm />
    </AuthShell>
  )
}
