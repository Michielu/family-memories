'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoPicker from '@/components/PhotoPicker'
import QuestionAnswer from '@/components/QuestionAnswer'

interface Props {
  entry: { id: string; week_of: string; answers: Record<string, string>; photo_urls: string[] }
  bankQuestions: Array<{ id: string; text: string; theme: string }>
  suggestions: Array<{ id: string; text: string; promoted: boolean }>
}

export default function WeekForm({ entry, bankQuestions, suggestions }: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>(entry.answers || {})
  const [photoUrls, setPhotoUrls] = useState<string[]>(entry.photo_urls || [])
  const [promoted, setPromoted] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  function setAnswer(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  async function handlePromote(suggestionId: string) {
    await fetch(`/api/suggestions/${suggestionId}/promote`, { method: 'POST' })
    setPromoted(prev => new Set([...prev, suggestionId]))
  }

  async function handlePreview() {
    setSaving(true)
    await fetch(`/api/entries/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, photoUrls }),
    })
    router.push(`/preview/${entry.id}`)
  }

  const weekLabel = new Date(entry.week_of + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Week of {weekLabel}</h1>
        <p className="text-sm text-gray-500 mt-1">A letter to your kids.</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">Photos</h2>
        <PhotoPicker selected={photoUrls} onSelect={setPhotoUrls} />
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="font-medium">This week</h2>
        {bankQuestions.map(q => (
          <QuestionAnswer
            key={q.id}
            questionId={q.id}
            text={q.text}
            answer={answers[q.id] || ''}
            onAnswerChange={setAnswer}
          />
        ))}
        {suggestions.length > 0 && (
          <>
            <p className="text-xs text-gray-400 -mb-3">✨ Suggested this week</p>
            {suggestions.map(s => (
              <QuestionAnswer
                key={s.id}
                questionId={s.id}
                text={s.text}
                isSuggestion
                answer={answers[s.id] || ''}
                onAnswerChange={setAnswer}
                onPromote={handlePromote}
                promoted={promoted.has(s.id)}
              />
            ))}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handlePreview}
        disabled={saving}
        className="bg-indigo-600 text-white rounded px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Preview letter →'}
      </button>
    </div>
  )
}
