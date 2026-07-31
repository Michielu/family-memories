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
    custom_questions: Record<string, string>
    note: string | null
  }
  allQuestions: Question[]
}

export default function WeekForm({ entry, allQuestions }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>(entry.question_ids || [])
  const [answers, setAnswers] = useState<Record<string, string>>(entry.answers || {})
  const [photoUrls, setPhotoUrls] = useState<string[]>(entry.photo_urls || [])
  const [customQuestions, setCustomQuestions] = useState<Record<string, string>>(entry.custom_questions || {})
  const [customInput, setCustomInput] = useState('')
  const [note, setNote] = useState<string>(entry.note || '')
  const [saving, setSaving] = useState(false)
  const [savingToBank, setSavingToBank] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)

  const questionMap = Object.fromEntries(allQuestions.map(q => [q.id, q]))

  function setAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function swapQuestion(oldId: string, newId: string) {
    setSelectedIds(prev => prev.map(id => id === oldId ? newId : id))
  }

  function addQuestion(id: string) {
    setSelectedIds(prev => [...prev, id])
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

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Week of {weekLabel}</h1>
        {entry.sent_at ? (
          <p className="text-sm text-green-700 mt-1">
            Sent on {new Date(entry.sent_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — each child received their own copy.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">A letter to your kids.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">Photos</h2>
        <PhotoPicker selected={photoUrls} onSelect={setPhotoUrls} />
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="font-medium">This week</h2>

        {selectedIds.map(id => {
          const q = questionMap[id]
          if (!q) return null
          const swapOptions = allQuestions.filter(o => o.id !== id && !selectedIds.includes(o.id))
          return (
            <div key={id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <label className="text-sm font-medium text-gray-800 leading-snug">{q.text}</label>
                {!entry.sent_at && swapOptions.length > 0 && (
                  <select
                    value=""
                    onChange={e => { if (e.target.value) swapQuestion(id, e.target.value) }}
                    className="shrink-0 text-xs border rounded px-1.5 py-0.5 text-gray-500 bg-white"
                  >
                    <option value="">Swap</option>
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
                className="border rounded px-3 py-2 text-sm resize-y w-full disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Write a few sentences…"
              />
            </div>
          )
        })}

        {!entry.sent_at && availableToAdd.length > 0 && (
          <div>
            <select
              value=""
              onChange={e => { if (e.target.value) addQuestion(e.target.value) }}
              className="text-sm border rounded px-2 py-1.5 text-gray-500 bg-white"
            >
              <option value="">+ Add a question…</option>
              {availableToAdd.map(q => (
                <option key={q.id} value={q.id}>{q.text}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-medium">Anything else? <span className="text-gray-400 font-normal text-sm">(optional)</span></label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          disabled={!!entry.sent_at}
          className="border rounded px-3 py-2 text-sm resize-y w-full disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="A thought, a memory, something funny…"
        />
      </div>

      {entry.sent_at ? (
        <div className="flex flex-col gap-2">
          <a
            href={`/preview/${entry.id}`}
            className="bg-gray-200 text-gray-600 rounded px-4 py-2.5 font-medium text-center"
          >
            View sent letter →
          </a>
          <button
            type="button"
            onClick={handleNewLetter}
            disabled={creatingNew}
            className="border border-indigo-600 text-indigo-600 rounded px-4 py-2.5 font-medium text-center disabled:opacity-50"
          >
            {creatingNew ? 'Creating…' : 'Write another letter this week'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePreview}
          disabled={saving}
          className="bg-indigo-600 text-white rounded px-4 py-2.5 font-medium disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Preview letter →'}
        </button>
      )}
    </div>
  )
}
