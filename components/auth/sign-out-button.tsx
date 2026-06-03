'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type SignOutButtonProps = {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()

    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      <LogOut size={16} className="mr-2" />
      {loading ? 'Signing Out...' : 'Sign Out'}
    </button>
  )
}
