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

  async function deleteQuestion(q: Question) {
    if (!confirm(`Delete "${q.text}"? This can't be undone.`)) return
    await fetch('/api/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: q.id }),
    })
    await load()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-hedvig text-3xl text-[#130e30]">Question Bank</h1>
        <a href="/" className="text-sm text-[#5f5c6e] underline underline-offset-2">← Home</a>
      </div>

      <form onSubmit={addQuestion} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Add a new question…"
          className="border border-[#130e30] rounded-full px-4 py-2 text-sm flex-1 bg-white text-[#130e30] placeholder:text-[#5f5c6e] focus:outline-none focus:ring-2 focus:ring-[#ffe228]"
        />
        <select
          value={newTheme}
          onChange={e => setNewTheme(e.target.value)}
          className="border border-[#130e30] rounded-full px-3 py-2 text-sm bg-white text-[#130e30] focus:outline-none"
        >
          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          type="submit"
          disabled={adding || !newText.trim()}
          className="bg-[#ffe228] text-[#130e30] rounded-full px-5 py-2 text-sm font-medium disabled:opacity-40"
        >
          Add
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {questions.map(q => (
          <div
            key={q.id}
            className={`bg-[#eff2e5] rounded-2xl px-5 py-4 flex gap-3 items-start transition-opacity ${!q.active ? 'opacity-40' : ''}`}
          >
            <div className="flex-1">
              <input
                type="text"
                defaultValue={q.text}
                onBlur={e => { if (e.target.value !== q.text) updateText(q, e.target.value) }}
                className="w-full text-sm bg-transparent border-b border-transparent hover:border-[#130e30]/30 focus:border-[#130e30] outline-none py-0.5 text-[#130e30]"
              />
              <div className="flex gap-3 mt-1.5 text-xs text-[#5f5c6e]">
                <span>{q.theme}</span>
                <span>{q.source}</span>
                <span>used {q.times_used}×</span>
                {q.last_used_at && (
                  <span>last {new Date(q.last_used_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0 text-right">
              <button
                type="button"
                onClick={() => toggleActive(q)}
                className="text-xs text-[#5f5c6e] hover:text-[#130e30]"
              >
                {q.active ? 'Disable' : 'Enable'}
              </button>
              <button
                type="button"
                onClick={() => deleteQuestion(q)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
