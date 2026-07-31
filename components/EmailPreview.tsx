'use client'
import { useState } from 'react'

interface EmailPreviewProps {
  initialHtml: string
  onSend: (html: string) => Promise<void>
  sending: boolean
  alreadySent?: boolean
}

export default function EmailPreview({ initialHtml, onSend, sending, alreadySent }: EmailPreviewProps) {
  const [html, setHtml] = useState(initialHtml)
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-hedvig text-xl text-[#130e30]">Preview</h2>
        {!alreadySent && (
          <button
            type="button"
            onClick={() => setEditing(e => !e)}
            className="text-sm text-[#5f5c6e] underline underline-offset-2"
          >
            {editing ? 'Done editing' : 'Edit HTML'}
          </button>
        )}
      </div>

      {editing ? (
        <textarea
          value={html}
          onChange={e => setHtml(e.target.value)}
          rows={20}
          className="border border-[#130e30] rounded-2xl px-4 py-3 text-sm font-mono w-full bg-white text-[#130e30] focus:outline-none focus:ring-2 focus:ring-[#ffe228]"
        />
      ) : (
        <div
          className="rounded-3xl bg-white border border-[#eff2e5] p-8 shadow-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      {!alreadySent && (
        <button
          type="button"
          onClick={() => onSend(html)}
          disabled={sending}
          className="bg-[#ffe228] text-[#130e30] rounded-full px-6 py-3 font-medium text-sm disabled:opacity-40"
        >
          {sending ? 'Sending…' : 'Send to the kids ✉️'}
        </button>
      )}
    </div>
  )
}
