import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { answers, photoUrls } = await request.json()
  const supabase = createClient()

  const { error } = await supabase
    .from('weekly_entries')
    .update({ answers: answers ?? {}, photo_urls: photoUrls ?? [] })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
