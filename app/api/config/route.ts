import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createClient()

  const { error } = await supabase.from('config').update({
    child1_name: body.child1Name,
    child2_name: body.child2Name,
    child1_email: body.child1Email,
    child2_email: body.child2Email,
    child1_birthday: body.child1Birthday || null,
    child2_birthday: body.child2Birthday || null,
    parent_email: body.parentEmail,
    updated_at: new Date().toISOString(),
  }).eq('id', 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
