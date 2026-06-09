import { NextResponse } from 'next/server'

import { getDashboardAccess } from '@/lib/auth/access'
import {
  getSupabaseAdminClient,
  getSupabaseStorageBucketName,
  hasSupabaseServiceRoleEnv,
} from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: Request) {
  const session = await getAuthenticatedUser()

  if (!session?.user) {
    return NextResponse.json({ detail: 'Please sign in again to continue.' }, { status: 401 })
  }

  const access = await getDashboardAccess(session.user)

  if (!access.allowed) {
    return NextResponse.json({ detail: 'You do not have permission to upload application logos.' }, { status: 403 })
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      { detail: 'Application management is not fully configured yet.' },
      { status: 500 },
    )
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')
  const slug = String(formData?.get('slug') || 'application').trim() || 'application'

  if (!(file instanceof File)) {
    return NextResponse.json({ detail: 'Choose a logo file to upload.' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ detail: 'Choose a valid image file.' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ detail: 'Choose an image smaller than 5 MB.' }, { status: 400 })
  }

  const bucket = getSupabaseStorageBucketName()
  const admin = getSupabaseAdminClient()
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'png'
  const safeSlug = sanitizeFileName(slug) || 'application'
  const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, '')) || 'logo'
  const path = `assets/logo/${safeSlug}-${Date.now()}-${safeName}.${extension}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json(
      { detail: 'We could not upload the logo right now. Please try again.' },
      { status: 502 },
    )
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path)

  return NextResponse.json({
    success: true,
    logoUrl: data.publicUrl,
  })
}
