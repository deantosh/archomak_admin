'use client'

import { LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const dynamic = 'force-dynamic'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash)
    const type = hashParams.get('type')

    let destination = '/dashboard'

    if (type === 'recovery') {
      destination = `/reset-password${window.location.search}${window.location.hash}`
    } else if (type === 'invite') {
      destination = `/accept-invite${window.location.search}${window.location.hash}`
    } else if (type === 'email_change' || type === 'signup' || type === 'magiclink') {
      destination = '/dashboard/settings?verification=confirmed'
    }

    router.replace(destination)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-200">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <LoaderCircle className="size-4 animate-spin text-emerald-300" />
        Redirecting to reset password...
      </div>
    </div>
  )
}
