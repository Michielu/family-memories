'use client'

interface QuestionAnswerProps {
  questionId: string
  text: string
  isSuggestion?: boolean
  answer: string
  onAnswerChange: (questionId: string, answer: string) => void
  onPromote?: (questionId: string) => void
  promoted?: boolean
}

export default function QuestionAnswer({
  questionId, text, isSuggestion, answer, onAnswerChange, onPromote, promoted,
}: QuestionAnswerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <label className="text-sm font-medium text-gray-800 leading-snug">{text}</label>
        {isSuggestion && onPromote && (
          <button
            type="button"
            onClick={() => onPromote(questionId)}
            disabled={promoted}
            className="shrink-0 text-xs text-indigo-600 border border-indigo-300 rounded px-2 py-0.5 disabled:opacity-40 disabled:cursor-default"
          >
            {promoted ? 'Added ✓' : '+ Add to bank'}
          </button>
        )}
      </div>
      <textarea
        value={answer}
        onChange={e => onAnswerChange(questionId, e.target.value)}
        rows={3}
        className="border rounded px-3 py-2 text-sm resize-y w-full"
        placeholder="Write a few sentences…"
      />
    </div>
  )
}
