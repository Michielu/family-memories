import { createClient } from '@/lib/supabase/server'
import { composeEmail } from '@/lib/claude'
import { NextResponse } from 'next/server'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: entry }, { data: config }] = await Promise.all([
    supabase.from('weekly_entries').select('*').eq('id', params.id).single(),
    supabase.from('config').select('*').single(),
  ])

  if (!entry || !config) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const questionIds = Object.keys(entry.answers || {})
  let questionTexts: Record<string, string> = {}

  if (questionIds.length > 0) {
    const [{ data: bankQs }, { data: suggestionQs }] = await Promise.all([
      supabase.from('questions').select('id,text').in('id', questionIds),
      supabase.from('claude_suggestions').select('id,text').in('id', questionIds),
    ])
    ;[...(bankQs || []), ...(suggestionQs || [])].forEach(q => {
      questionTexts[q.id] = q.text
    })
  }

  const answers = Object.entries(entry.answers || {})
    .filter(([, ans]) => (ans as string).trim().length > 0)
    .map(([id, ans]) => ({ question: questionTexts[id] || '', answer: ans as string }))
    .filter(a => a.question)

  const weekLabel = new Date(entry.week_of + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const body = await composeEmail({
    weekOf: weekLabel,
    child1Name: config.child1_name,
    child2Name: config.child2_name,
    answers,
  })

  const emailPreview = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1a1a1a;line-height:1.7">
      ${body}
      <p style="margin-top:32px">Love, Dad</p>
    </div>
  `

  await supabase.from('weekly_entries').update({ email_preview: emailPreview }).eq('id', params.id)

  return NextResponse.json({ html: emailPreview })
}
