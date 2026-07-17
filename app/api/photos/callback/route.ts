import { exchangeCodeForToken } from '@/lib/google-photos'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) return NextResponse.redirect(`${origin}/?error=no_code`)

  try {
    await exchangeCodeForToken(code)
    return NextResponse.redirect(`${origin}/`)
  } catch (e) {
    console.error('Google Photos OAuth error:', e)
    return NextResponse.redirect(`${origin}/?error=oauth_failed`)
  }
}
