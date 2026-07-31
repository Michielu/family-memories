'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import EmailPreview from '@/components/EmailPreview'

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [html, setHtml] = useState<string | null>(null)
  const [sentAt, setSentAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/entries/${id}`)
      .then(r => r.json())
      .then(async ({ entry }) => {
        if (entry?.sent_at) {
          setHtml(entry.email_preview)
          setSentAt(entry.sent_at)
          setLoading(false)
        } else {
          const res = await fetch(`/api/entries/${id}/compose`, { method: 'POST' })
          const data = await res.json()
          setHtml(data.html)
          setLoading(false)
        }
      })
  }, [id])

  async function handleSend(editedHtml: string) {
    setSending(true)
    const res = await fetch(`/api/entries/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: editedHtml }),
    })
    if (res.ok) {
      router.push('/?sent=1')
    } else {
      alert('Send failed — check console')
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#5f5c6e] text-sm">Composing your letter…</p>
      </div>
    )
  }

  const sentLabel = sentAt
    ? new Date(sentAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <a href={`/week/${id}`} className="text-sm text-[#5f5c6e] underline underline-offset-2 mb-6 block">
        ← Back to edit
      </a>

      {sentLabel && (
        <div className="mb-6 rounded-2xl bg-[#eff2e5] px-5 py-3 text-sm text-[#130e30]">
          Sent {sentLabel} — each child received their own copy.
        </div>
      )}

      <EmailPreview
        initialHtml={html!}
        onSend={handleSend}
        sending={sending}
        alreadySent={!!sentAt}
      />
    </div>
  )
}
