'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoPicker from '@/components/PhotoPicker'

interface Question {
  id: string
  text: string
  theme: string
}

interface Props {
  entry: {
    id: string
    week_of: string
    answers: Record<string, string>
    photo_urls: string[]
    sent_at: string | null
    question_ids: string[]
    note: string | null
  }
  allQuestions: Question[]
}

export default function WeekForm({ entry, allQuestions }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>(entry.question_ids || [])
  const [answers, setAnswers] = useState<Record<string, string>>(entry.answers || {})
  const [photoUrls, setPhotoUrls] = useState<string[]>(entry.photo_urls || [])
  const [note, setNote] = useState<string>(entry.note || '')
  const [saving, setSaving] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)
  const [localQuestions, setLocalQuestions] = useState<Question[]>([])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [showNewQuestion, setShowNewQuestion] = useState(false)

  const questionMap = Object.fromEntries(
    [...allQuestions, ...localQuestions].map(q => [q.id, q])
  )

  function setAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function swapQuestion(oldId: string, newId: string) {
    setSelectedIds(prev => prev.map(id => id === oldId ? newId : id))
  }

  function addQuestion(id: string) {
    setSelectedIds(prev => [...prev, id])
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault()
    const text = newQuestionText.trim()
    if (!text) return
    setAddingQuestion(true)
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, theme: 'feelings' }),
    })
    const data = await res.json()
    if (data.question) {
      setLocalQuestions(prev => [...prev, data.question])
      setSelectedIds(prev => [...prev, data.question.id])
      setNewQuestionText('')
      setShowNewQuestion(false)
    }
    setAddingQuestion(false)
  }

  async function handleNewLetter() {
    setCreatingNew(true)
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekOf: entry.week_of }),
    })
    const data = await res.json()
    if (data.id) {
      router.push(`/week/${data.id}`)
    } else {
      alert('Failed to create new letter')
      setCreatingNew(false)
    }
  }

  async function handlePreview() {
    setSaving(true)
    await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, photoUrls, questionIds: selectedIds, note }),
    })
    router.push(`/preview/${entry.id}`)
  }

  const weekLabel = new Date(entry.week_of + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const availableToAdd = allQuestions.filter(q => !selectedIds.includes(q.id))

  const fieldClass = 'border border-[#130e30] rounded-2xl px-4 py-3 text-sm w-full bg-white text-[#130e30] placeholder:text-[#5f5c6e] disabled:bg-[#eff2e5] disabled:text-[#5f5c6e] focus:outline-none focus:ring-2 focus:ring-[#ffe228] transition-shadow resize-y'

  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col gap-10">

      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-[#5f5c6e] mb-2">{weekLabel}</p>
        <h1 className="font-hedvig text-3xl font-bold text-[#130e30]">This week&apos;s letter</h1>
        {entry.sent_at ? (
          <p className="text-sm text-[#5f5c6e] mt-1">
            Sent {new Date(entry.sent_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        ) : (
          <p className="text-sm text-[#5f5c6e] mt-1">A note to your kids</p>
        )}
      </div>

      {/* Photos */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-[#5f5c6e]">Photos</p>
        <PhotoPicker selected={photoUrls} onSelect={setPhotoUrls} />
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-8">
        <p className="text-xs font-medium uppercase tracking-widest text-[#5f5c6e]">This week</p>

        {selectedIds.map(id => {
          const q = questionMap[id]
          if (!q) return null
          const swapOptions = allQuestions.filter(o => o.id !== id && !selectedIds.includes(o.id))
          return (
            <div key={id} className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-[#130e30] leading-snug">{q.text}</p>
                {!entry.sent_at && swapOptions.length > 0 && (
                  <select
                    value=""
                    onChange={e => { if (e.target.value) swapQuestion(id, e.target.value) }}
                    className="self-start text-xs text-[#5f5c6e] bg-transparent border-none cursor-pointer focus:outline-none -ml-0.5"
                  >
                    <option value="">↕ swap question</option>
                    {swapOptions.map(o => (
                      <option key={o.id} value={o.id}>{o.text}</option>
                    ))}
                  </select>
                )}
              </div>
              <textarea
                value={answers[id] || ''}
                onChange={e => setAnswer(id, e.target.value)}
                rows={3}
                disabled={!!entry.sent_at}
                className={fieldClass}
                placeholder="Write a few sentences…"
              />
            </div>
          )
        })}

        {!entry.sent_at && (
          <div className="flex flex-col gap-2">
            {availableToAdd.length > 0 && (
              <select
                value=""
                onChange={e => { if (e.target.value) addQuestion(e.target.value) }}
                className="text-sm text-[#5f5c6e] bg-white border border-[#eff2e5] rounded-full px-4 py-2.5 cursor-pointer w-full focus:outline-none focus:ring-2 focus:ring-[#ffe228]"
              >
                <option value="">+ Add a question…</option>
                {availableToAdd.map(q => (
                  <option key={q.id} value={q.id}>{q.text}</option>
                ))}
              </select>
            )}

            {showNewQuestion ? (
              <form onSubmit={handleCreateQuestion} className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  placeholder="Type your question…"
                  className="flex-1 border border-[#130e30] rounded-full px-4 py-2 text-sm bg-white text-[#130e30] placeholder:text-[#5f5c6e] focus:outline-none focus:ring-2 focus:ring-[#ffe228]"
                />
                <button
                  type="submit"
                  disabled={addingQuestion || !newQuestionText.trim()}
                  className="bg-[#ffe228] text-[#130e30] rounded-full px-4 py-2 text-sm font-medium disabled:opacity-40 shrink-0"
                >
                  {addingQuestion ? '…' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewQuestion(false); setNewQuestionText('') }}
                  className="text-sm text-[#5f5c6e] px-2"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewQuestion(true)}
                className="self-start text-xs text-[#5f5c6e] underline underline-offset-2"
              >
                + Write your own question
              </button>
            )}
          </div>
        )}
      </div>

      {/* Free note */}
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={3}
        disabled={!!entry.sent_at}
        className={fieldClass}
        placeholder="Anything else? A thought, a memory, something funny… (optional)"
      />

      {/* Actions */}
      {entry.sent_at ? (
        <div className="flex flex-col gap-3">
          <a
            href={`/preview/${entry.id}`}
            className="bg-[#eff2e5] text-[#130e30] rounded-full px-6 py-3 font-medium text-sm text-center"
          >
            View sent letter →
          </a>
          <button
            type="button"
            onClick={handleNewLetter}
            disabled={creatingNew}
            className="border border-[#130e30] text-[#130e30] rounded-full px-6 py-3 font-medium text-sm text-center disabled:opacity-40"
          >
            {creatingNew ? 'Creating…' : 'Write another letter this week'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePreview}
          disabled={saving}
          className="bg-[#ffe228] text-[#130e30] rounded-full px-6 py-3 font-medium text-sm disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Preview letter →'}
        </button>
      )}
    </div>
  )
}
