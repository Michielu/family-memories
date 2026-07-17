'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-gray-600">
          Check your email — a login link is on its way to <strong>{email}</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-xl font-semibold">Memory Letters</h1>
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send login link'}
        </button>
      </form>
    </div>
  )
}
