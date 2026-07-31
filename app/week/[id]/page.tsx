import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import WeekForm from './WeekForm'

export default async function WeekPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: entry }, { data: allQuestions }] = await Promise.all([
    supabase.from('weekly_entries').select('*').eq('id', params.id).single(),
    supabase.from('questions').select('id,text,theme').order('theme').order('text'),
  ])

  if (!entry) notFound()

  return (
    <WeekForm
      entry={entry}
      allQuestions={allQuestions || []}
    />
  )
}
