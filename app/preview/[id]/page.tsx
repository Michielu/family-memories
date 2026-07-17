'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import EmailPreview from '@/components/EmailPreview'

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/entries/${id}/compose`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setHtml(data.html)
        setLoading(false)
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
        <p className="text-gray-400">Composing your letter…</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <a href={`/week/${id}`} className="text-sm text-gray-400 underline mb-4 block">← Back to edit</a>
      <EmailPreview initialHtml={html!} onSend={handleSend} sending={sending} />
    </div>
  )
}
