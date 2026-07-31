import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { weekOf } = await request.json()
  if (!weekOf) return NextResponse.json({ error: 'weekOf required' }, { status: 400 })

  const supabase = createClient()
  const { data: entry, error } = await supabase
    .from('weekly_entries')
    .insert({ week_of: weekOf })
    .select('id')
    .single()

  if (error || !entry) return NextResponse.json({ error: error?.message ?? 'Failed to create entry' }, { status: 500 })

  return NextResponse.json({ id: entry.id })
}
