import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: entry } = await supabase
    .from('weekly_entries')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const questionIds = Object.keys(entry.answers || {})
  const questionTexts: Record<string, string> = {}

  if (questionIds.length > 0) {
    const { data: bankQs } = await supabase
      .from('questions')
      .select('id,text')
      .in('id', questionIds)
    ;(bankQs || []).forEach(q => { questionTexts[q.id] = q.text })
  }

  const answers = Object.entries(entry.answers || {})
    .filter(([, ans]) => (ans as string).trim().length > 0)
    .map(([id, ans]) => ({ question: questionTexts[id] || '', answer: ans as string }))
    .filter(a => a.question)

  const weekLabel = new Date(entry.week_of + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const noteHtml = entry.note?.trim()
    ? `<p style="margin:0 0 28px;white-space:pre-wrap">${entry.note.trim()}</p>`
    : ''

  const sections = answers
    .map(a => `
      <section style="margin-bottom:24px">
        <h2 style="font-size:1em;font-weight:600;color:#555;margin:0 0 6px">${a.question}</h2>
        <p style="margin:0;white-space:pre-wrap">${a.answer}</p>
      </section>`)
    .join('')

  const emailPreview = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1a1a1a;line-height:1.7">
      <p style="color:#888;font-size:0.85em;margin:0 0 28px">Week of ${weekLabel}</p>
      ${noteHtml}${sections}
      <p style="margin-top:32px">Love, Dad</p>
    </div>
  `

  await supabase.from('weekly_entries').update({ email_preview: emailPreview }).eq('id', params.id)

  return NextResponse.json({ html: emailPreview })
}
