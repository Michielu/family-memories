import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { selectWeeklyQuestions } from '@/lib/questions'
import { sendReminderEmail } from '@/lib/resend'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: config } = await supabase.from('config').select('parent_email').single()

  if (!config?.parent_email) {
    return NextResponse.json({ error: 'Config not set up' }, { status: 500 })
  }

  const weekOf = getThisSunday()

  const { data: existing } = await supabase
    .from('weekly_entries')
    .select('id')
    .eq('week_of', weekOf)
    .single()

  if (existing) {
    return NextResponse.json({ message: 'Entry already exists', entryId: existing.id })
  }

  const bankQuestions = await selectWeeklyQuestions(3, supabase)
  const questionIds = bankQuestions.map(q => q.id)

  const { data: entry, error: entryError } = await supabase
    .from('weekly_entries')
    .insert({ week_of: weekOf, question_ids: questionIds })
    .select()
    .single()

  if (entryError || !entry) {
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }

  const formUrl = `${process.env.NEXT_PUBLIC_APP_URL}/week/${entry.id}`
  await sendReminderEmail({ to: config.parent_email, formUrl, weekOf })

  return NextResponse.json({ success: true, entryId: entry.id })
}

function getThisSunday(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? 0 : -dayOfWeek
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + diff)
  return sunday.toISOString().split('T')[0]
}

