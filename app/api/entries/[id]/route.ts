import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weekly_entries')
    .select('id,week_of,sent_at,email_preview')
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ entry: data })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { answers, photoUrls, questionIds } = await request.json()
  const supabase = createClient()

  const patch: Record<string, unknown> = {
    answers: answers ?? {},
    photo_urls: photoUrls ?? [],
  }
  if (questionIds !== undefined) patch.question_ids = questionIds

  const { error } = await supabase
    .from('weekly_entries')
    .update(patch)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
