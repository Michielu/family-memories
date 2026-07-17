import { createServiceClient } from './supabase/server'

export interface Photo {
  id: string
  thumbnailUrl: string
  downloadUrl: string
  filename: string
}

function makeOAuth2Client() {
  const { google } = require('googleapis')
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/photos/callback`
  )
}

export function getAuthUrl(): string {
  const client = makeOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/photoslibrary.readonly'],
    prompt: 'consent',
  })
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const client = makeOAuth2Client()
  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token) throw new Error('No refresh token returned')

  const supabase = createServiceClient()
  await supabase.from('config').update({ google_refresh_token: tokens.refresh_token }).eq('id', 1)

  return tokens.refresh_token
}

async function getAccessToken(): Promise<string> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('config').select('google_refresh_token').single()
  if (!data?.google_refresh_token) throw new Error('No Google Photos token configured')

  const client = makeOAuth2Client()
  client.setCredentials({ refresh_token: data.google_refresh_token })
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('Failed to get access token')
  return token
}

export async function getRecentPhotos(daysBack = 7): Promise<Photo[]> {
  const accessToken = await getAccessToken()

  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - daysBack)

  const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pageSize: 50,
      filters: {
        dateFilter: {
          ranges: [{
            startDate: { year: start.getFullYear(), month: start.getMonth() + 1, day: start.getDate() },
            endDate: { year: end.getFullYear(), month: end.getMonth() + 1, day: end.getDate() },
          }],
        },
        mediaTypeFilter: { mediaTypes: ['PHOTO'] },
      },
    }),
  })

  if (!response.ok) throw new Error(`Photos API error: ${response.status}`)
  const data = await response.json()

  return (data.mediaItems || []).map((item: any) => ({
    id: item.id,
    thumbnailUrl: `${item.baseUrl}=w400-h300-c`,
    downloadUrl: `${item.baseUrl}=d`,
    filename: item.filename,
  }))
}

export async function downloadPhoto(downloadUrl: string): Promise<Buffer> {
  const response = await fetch(downloadUrl)
  if (!response.ok) throw new Error(`Failed to download photo: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}
