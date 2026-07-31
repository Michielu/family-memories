import { createClient } from '@/lib/supabase/server'
import { downloadPhoto } from '@/lib/google-photos'
import { sendMemoryEmail, sendFailureNotification } from '@/lib/resend'
import { markQuestionsUsed } from '@/lib/questions'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { html } = await request.json()
  const supabase = createClient()

  const [{ data: entry }, { data: config }, { data: children }] = await Promise.all([
    supabase.from('weekly_entries').select('*').eq('id', params.id).single(),
    supabase.from('config').select('parent_email').single(),
    supabase.from('children').select('name,email').order('position', { ascending: true }),
  ])

  if (!entry || !config) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (entry.sent_at) return NextResponse.json({ error: 'Already sent' }, { status: 409 })

  // Download photos as buffers (attach, not link).
  // Google Photos download URLs expire ~60 min after the form was loaded.
  // If a download fails, the email still sends without that photo.
  const photoBuffers: Array<{ filename: string; content: Buffer }> = []
  for (const url of entry.photo_urls || []) {
    try {
      const content = await downloadPhoto(url)
      const filename = `photo-${photoBuffers.length + 1}.jpg`
      photoBuffers.push({ filename, content })
    } catch (e) {
      console.error(`Failed to download photo ${url}:`, e)
    }
  }

  const weekLabel = new Date(entry.week_of + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const recipients = (children || []).filter(c => c.email)

  try {
    await sendMemoryEmail({
      recipients,
      subject: `Week of ${weekLabel} — from Dad`,
      html,
      photoBuffers,
    })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('Memory email send failed:', err)
    await supabase.from('weekly_entries').update({ email_preview: html }).eq('id', params.id)

    try {
      await sendFailureNotification({
        to: config.parent_email,
        entryId: params.id,
        error: err.message,
      })
    } catch {}

    return NextResponse.json({ error: 'Send failed', detail: err.message }, { status: 500 })
  }

  await supabase.from('weekly_entries').update({
    sent_at: new Date().toISOString(),
    email_preview: html,
  }).eq('id', params.id)

  await markQuestionsUsed(entry.question_ids || [])

  return NextResponse.json({ ok: true })
}
