import { NextRequest, NextResponse } from 'next/server'

import { KunanyeshaAdminPaymentItem, KunanyeshaAdminPaymentsResponse } from '@/lib/kunanyesha-admin-types'
import { fetchKunanyeshaAdmin, hasKunanyeshaAdminEnv } from '@/lib/server/kunanyesha-admin'
import { getSupabaseAdminClient, hasSupabaseServiceRoleEnv } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function enrichWithEmails(items: KunanyeshaAdminPaymentItem[]): Promise<KunanyeshaAdminPaymentItem[]> {
  if (!hasSupabaseServiceRoleEnv()) return items

  const userIds = [...new Set(items.filter((p) => p.user_id && !p.email).map((p) => p.user_id!))]

  if (userIds.length === 0) return items

  const adminClient = getSupabaseAdminClient()
  const emailMap = new Map<string, string>()

  await Promise.all(
    userIds.map(async (userId) => {
      const { data } = await adminClient.auth.admin.getUserById(userId)
      if (data?.user?.email) {
        emailMap.set(userId, data.user.email)
      }
    }),
  )

  return items.map((item) => ({
    ...item,
    email: item.email ?? (item.user_id ? (emailMap.get(item.user_id) ?? null) : null),
  }))
}

export async function GET(request: NextRequest) {
  if (!hasKunanyeshaAdminEnv()) {
    return NextResponse.json({ detail: 'The application connection is incomplete.' }, { status: 500 })
  }

  try {
    const data = (await fetchKunanyeshaAdmin(
      'payments',
      request.nextUrl.searchParams,
    )) as KunanyeshaAdminPaymentsResponse

    const items = await enrichWithEmails(data.items)

    return NextResponse.json({ ...data, items })
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : 'We could not load payment data right now.',
      },
      { status: 502 },
    )
  }
}
