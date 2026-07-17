import { getAuthUrl } from '@/lib/google-photos'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.redirect(getAuthUrl())
}
