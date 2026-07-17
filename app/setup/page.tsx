'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    child1Name: '', child2Name: '',
    child1Email: '', child2Email: '',
    child1Birthday: '', child2Birthday: '',
    parentEmail: '',
  })

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.push('/')
  }

  const field = (label: string, key: string, type = 'text') => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => set(key, e.target.value)}
        className="border rounded px-3 py-2"
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <h1 className="text-xl font-semibold">Set up Memory Letters</h1>
        {field('Your email (reminder emails go here)', 'parentEmail', 'email')}
        <hr />
        {field('Child 1 name', 'child1Name')}
        {field('Child 1 future email (they get this at 18)', 'child1Email', 'email')}
        {field('Child 1 birthday', 'child1Birthday', 'date')}
        <hr />
        {field('Child 2 name', 'child2Name')}
        {field('Child 2 future email', 'child2Email', 'email')}
        {field('Child 2 birthday', 'child2Birthday', 'date')}
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white rounded px-4 py-2 mt-2 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </div>
  )
}
