'use client'

interface QuestionAnswerProps {
  questionId: string
  text: string
  answer: string
  onAnswerChange: (questionId: string, answer: string) => void
}

export default function QuestionAnswer({ questionId, text, answer, onAnswerChange }: QuestionAnswerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-800 leading-snug">{text}</label>
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
