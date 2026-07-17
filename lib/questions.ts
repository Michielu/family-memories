import { createClient } from './supabase/server'

export interface Question {
  id: string
  text: string
  theme: string
  source: 'manual' | 'claude'
  times_used: number
  last_used_at: string | null
}

export async function selectWeeklyQuestions(count = 3, clientOverride?: any): Promise<Question[]> {
  const supabase = clientOverride || createClient()

  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .or(`last_used_at.is.null,last_used_at.lt.${eightWeeksAgo.toISOString()}`)
    .order('last_used_at', { ascending: true, nullsFirst: true })

  const pool = questions || []
  const selected: Question[] = []
  const usedThemes = new Set<string>()

  for (const q of pool) {
    if (selected.length >= count) break
    if (!usedThemes.has(q.theme)) {
      selected.push(q)
      usedThemes.add(q.theme)
    }
  }

  for (const q of pool) {
    if (selected.length >= count) break
    if (!selected.find(s => s.id === q.id) && !usedThemes.has(q.theme)) {
      selected.push(q)
      usedThemes.add(q.theme)
    }
  }

  // Fall back to all active questions only when the eligible pool is smaller than count
  // (e.g. every question was used recently). Theme diversity is preserved in fallback too.
  if (pool.length < count) {
    const { data: all } = await supabase
      .from('questions')
      .select('*')
      .eq('active', true)
      .order('last_used_at', { ascending: true, nullsFirst: true })

    const fallbackSelected: Question[] = []
    const fallbackThemes = new Set<string>()
    for (const q of (all || [])) {
      if (fallbackSelected.length >= count) break
      if (!fallbackThemes.has(q.theme)) {
        fallbackSelected.push(q)
        fallbackThemes.add(q.theme)
      }
    }
    return fallbackSelected
  }

  return selected
}

export async function markQuestionsUsed(questionIds: string[]): Promise<void> {
  const supabase = createClient()
  await Promise.all(
    questionIds.map(id => supabase.rpc('increment_question_usage', { question_id: id }))
  )
}
