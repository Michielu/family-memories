import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('times_used', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: data })
}

export async function POST(request: Request) {
  const { text, theme } = await request.json()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('questions')
    .insert({ text, theme, source: 'manual' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ question: data })
}

export async function PATCH(request: Request) {
  const { id, ...updates } = await request.json()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ question: data })
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const supabase = createClient()
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
