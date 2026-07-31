import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .order('position', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ children: data })
}

export async function POST(request: Request) {
  const { name, email, birthday } = await request.json()
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('children')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = existing ? existing.position + 1 : 0

  const { data, error } = await supabase
    .from('children')
    .insert({ name, email: email || '', birthday: birthday || null, position })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ child: data })
}

export async function PATCH(request: Request) {
  const { id, ...updates } = await request.json()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ child: data })
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const supabase = createClient()
  const { error } = await supabase.from('children').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
