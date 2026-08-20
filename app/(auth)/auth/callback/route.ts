import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * construe el origin desde el Host REAL de la request.
 * En dev, request.nextUrl.origin siempre devuelve http://localhost:3001
 * aunque entres por la IP Tailscale (iPhone), lo que rompía el redirect post-login.
 */
function buildOrigin(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3001'
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const origin = buildOrigin(request)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
