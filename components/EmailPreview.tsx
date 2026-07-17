'use client'
import { useState } from 'react'

interface EmailPreviewProps {
  initialHtml: string
  onSend: (html: string) => Promise<void>
  sending: boolean
}

export default function EmailPreview({ initialHtml, onSend, sending }: EmailPreviewProps) {
  const [html, setHtml] = useState(initialHtml)
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Preview</h2>
        <button
          type="button"
          onClick={() => setEditing(e => !e)}
          className="text-sm text-indigo-600 underline"
        >
          {editing ? 'Done editing' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <textarea
          value={html}
          onChange={e => setHtml(e.target.value)}
          rows={20}
          className="border rounded px-3 py-2 text-sm font-mono w-full"
        />
      ) : (
        <div
          className="border rounded p-6 bg-white shadow-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      <button
        type="button"
        onClick={() => onSend(html)}
        disabled={sending}
        className="bg-indigo-600 text-white rounded px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Send to the kids ✉️'}
      </button>
    </div>
  )
}
