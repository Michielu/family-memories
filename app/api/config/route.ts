import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createClient()

  const { error } = await supabase.from('config').update({
    parent_email: body.parentEmail,
    updated_at: new Date().toISOString(),
  }).eq('id', 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
