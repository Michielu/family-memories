import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: suggestion } = await supabase
    .from('claude_suggestions')
    .select('text')
    .eq('id', params.id)
    .single()

  if (!suggestion) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await Promise.all([
    supabase.from('questions').insert({ text: suggestion.text, theme: 'feelings', source: 'claude' }),
    supabase.from('claude_suggestions').update({ promoted: true }).eq('id', params.id),
  ])

  return NextResponse.json({ ok: true })
}
