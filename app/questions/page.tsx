'use client'
import { useEffect, useState } from 'react'

const THEMES = ['milestone', 'funny', 'feelings', 'routines', 'gratitude']

interface Question {
  id: string
  text: string
  theme: string
  times_used: number
  active: boolean
  source: string
  last_used_at: string | null
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newText, setNewText] = useState('')
  const [newTheme, setNewTheme] = useState('feelings')
  const [adding, setAdding] = useState(false)

  async function load() {
    const res = await fetch('/api/questions')
    const data = await res.json()
    setQuestions(data.questions || [])
  }

  useEffect(() => { load() }, [])

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!newText.trim()) return
    setAdding(true)
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText.trim(), theme: newTheme }),
    })
    setNewText('')
    await load()
    setAdding(false)
  }

  async function toggleActive(q: Question) {
    await fetch('/api/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: q.id, active: !q.active }),
    })
    await load()
  }

  async function updateText(q: Question, text: string) {
    await fetch('/api/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: q.id, text }),
    })
    await load()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Question Bank</h1>
        <a href="/" className="text-sm text-gray-400 underline">← Home</a>
      </div>

      <form onSubmit={addQuestion} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Add a new question…"
          className="border rounded px-3 py-2 text-sm flex-1"
        />
        <select
          value={newTheme}
          onChange={e => setNewTheme(e.target.value)}
          className="border rounded px-2 py-2 text-sm"
        >
          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          type="submit"
          disabled={adding || !newText.trim()}
          className="bg-indigo-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {questions.map(q => (
          <div
            key={q.id}
            className={`border rounded p-3 flex gap-3 items-start ${!q.active ? 'opacity-40' : ''}`}
          >
            <div className="flex-1">
              <input
                type="text"
                defaultValue={q.text}
                onBlur={e => { if (e.target.value !== q.text) updateText(q, e.target.value) }}
                className="w-full text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-400 outline-none py-0.5"
              />
              <div className="flex gap-3 mt-1 text-xs text-gray-400">
                <span>{q.theme}</span>
                <span>{q.source}</span>
                <span>used {q.times_used}×</span>
                {q.last_used_at && (
                  <span>last {new Date(q.last_used_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleActive(q)}
              className="text-xs text-gray-400 hover:text-gray-700 shrink-0"
            >
              {q.active ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
