import { getRecentPhotos } from '@/lib/google-photos'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const photos = await getRecentPhotos(7)
    return NextResponse.json({ photos })
  } catch (e: any) {
    if (e.message?.includes('No Google Photos token')) {
      return NextResponse.json({ photos: [], needsAuth: true })
    }
    return NextResponse.json({ photos: [], error: e.message })
  }
}
