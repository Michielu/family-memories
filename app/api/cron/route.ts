import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { selectWeeklyQuestions } from '@/lib/questions'
import { generateQuestionSuggestions } from '@/lib/claude'
import { sendReminderEmail } from '@/lib/resend'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: config } = await supabase.from('config').select('*').single()
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

  try {
    const ctx = {
      season: getSeason(),
      child1Age: getAgeString(config.child1_birthday),
      child2Age: getAgeString(config.child2_birthday),
      recentThemes: bankQuestions.map(q => q.theme),
    }
    const suggestions = await generateQuestionSuggestions(ctx)
    if (suggestions.length > 0) {
      await supabase.from('claude_suggestions').insert(
        suggestions.map(text => ({ text, entry_id: entry.id }))
      )
    }
  } catch (e) {
    console.error('Claude suggestions failed (non-fatal):', e)
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

function getSeason(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

function getAgeString(birthday: string | null): string {
  if (!birthday) return 'young'
  const birth = new Date(birthday)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 24) return `${months} months old`
  return `${Math.floor(months / 12)} years old`
}
