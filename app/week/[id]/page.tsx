import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import WeekForm from './WeekForm'

interface Question {
  id: string
  text: string
  theme: string
}

export default async function WeekPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: entry }, { data: suggestions }] = await Promise.all([
    supabase.from('weekly_entries').select('*').eq('id', params.id).single(),
    supabase.from('claude_suggestions').select('*').eq('entry_id', params.id),
  ])

  if (!entry) notFound()

  let bankQuestions: Question[] = []
  if (entry.question_ids?.length > 0) {
    const { data } = await supabase
      .from('questions')
      .select('id,text,theme')
      .in('id', entry.question_ids)
    bankQuestions = data || []
  }

  return (
    <WeekForm
      entry={entry}
      bankQuestions={bankQuestions}
      suggestions={suggestions || []}
    />
  )
}
