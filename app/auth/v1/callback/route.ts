import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = searchParams.get('type')
  const tokenHash = searchParams.get('token_hash')
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const destination = new URL('/reset-password', request.url)

  if (type) {
    destination.searchParams.set('type', type)
  }

  if (tokenHash) {
    destination.searchParams.set('token_hash', tokenHash)
  }

  if (code) {
    destination.searchParams.set('code', code)
  }

  if (error) {
    destination.searchParams.set('error', error)
  }

  if (errorDescription) {
    destination.searchParams.set('error_description', errorDescription)
  }

  return NextResponse.redirect(destination)
}
