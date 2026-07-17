'use client'
import { useEffect, useState } from 'react'

interface Photo {
  id: string
  thumbnailUrl: string
  downloadUrl: string
  filename: string
}

interface PhotoPickerProps {
  selected: string[]
  onSelect: (downloadUrls: string[]) => void
}

export default function PhotoPicker({ selected, onSelect }: PhotoPickerProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [needsAuth, setNeedsAuth] = useState(false)
  const [loading, setLoading] = useState(true)
  const [manualUrl, setManualUrl] = useState('')

  useEffect(() => {
    fetch('/api/photos/recent')
      .then(r => r.json())
      .then(data => {
        setPhotos(data.photos || [])
        setNeedsAuth(!!data.needsAuth)
        setLoading(false)
      })
  }, [])

  function toggle(photo: Photo) {
    const url = photo.downloadUrl
    if (selected.includes(url)) {
      onSelect(selected.filter(u => u !== url))
    } else if (selected.length < 3) {
      onSelect([...selected, url])
    }
  }

  function addManualUrl() {
    const trimmed = manualUrl.trim()
    if (trimmed && !selected.includes(trimmed) && selected.length < 3) {
      onSelect([...selected, trimmed])
      setManualUrl('')
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading photos…</p>

  if (needsAuth) {
    return (
      <div className="border rounded p-4 bg-amber-50">
        <p className="text-sm text-amber-800 mb-2">Connect Google Photos to auto-load this week's pictures.</p>
        <a href="/api/photos/auth" className="text-indigo-600 underline text-sm">Connect Google Photos</a>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">Select up to 3 photos from the past week.</p>
      <div className="grid grid-cols-4 gap-2">
        {photos.map(photo => (
          <button
            key={photo.id}
            type="button"
            onClick={() => toggle(photo)}
            className={`relative aspect-square overflow-hidden rounded border-2 transition-all ${
              selected.includes(photo.downloadUrl) ? 'border-indigo-500 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img src={photo.thumbnailUrl} alt={photo.filename} className="w-full h-full object-cover" />
            {selected.includes(photo.downloadUrl) && (
              <div className="absolute top-1 right-1 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selected.indexOf(photo.downloadUrl) + 1}
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-1">
        <input
          type="url"
          placeholder="Or paste a Google Photos share URL"
          value={manualUrl}
          onChange={e => setManualUrl(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm flex-1"
        />
        <button
          type="button"
          onClick={addManualUrl}
          disabled={!manualUrl || selected.length >= 3}
          className="text-sm px-3 py-1.5 border rounded disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  )
}
