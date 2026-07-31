'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Child {
  id: string
  name: string
  email: string
  birthday: string | null
}

export default function SetupPage() {
  const router = useRouter()
  const [parentEmail, setParentEmail] = useState('')
  const [children, setChildren] = useState<Child[]>([])
  const [savingParent, setSavingParent] = useState(false)
  const [newChild, setNewChild] = useState({ name: '', email: '', birthday: '' })
  const [addingChild, setAddingChild] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', birthday: '' })

  useEffect(() => {
    fetch('/api/children').then(r => r.json()).then(d => setChildren(d.children || []))
  }, [])

  async function saveParentEmail(e: React.FormEvent) {
    e.preventDefault()
    setSavingParent(true)
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentEmail }),
    })
    setSavingParent(false)
    router.push('/')
  }

  async function addChild(e: React.FormEvent) {
    e.preventDefault()
    if (!newChild.name.trim()) return
    setAddingChild(true)
    const res = await fetch('/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newChild),
    })
    const data = await res.json()
    setChildren(prev => [...prev, data.child])
    setNewChild({ name: '', email: '', birthday: '' })
    setAddingChild(false)
  }

  async function deleteChild(id: string) {
    await fetch('/api/children', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setChildren(prev => prev.filter(c => c.id !== id))
  }

  function startEdit(child: Child) {
    setEditingId(child.id)
    setEditForm({ name: child.name, email: child.email, birthday: child.birthday || '' })
  }

  async function saveEdit(id: string) {
    const res = await fetch('/api/children', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    })
    const data = await res.json()
    setChildren(prev => prev.map(c => c.id === id ? data.child : c))
    setEditingId(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col gap-8 w-full max-w-md">
        <h1 className="text-xl font-semibold">Set up Memory Letters</h1>

        {/* Parent email */}
        <form onSubmit={saveParentEmail} className="flex flex-col gap-3">
          <h2 className="font-medium text-sm text-gray-700">Your email</h2>
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={parentEmail}
            onChange={e => setParentEmail(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={savingParent}
            className="bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-50 self-start"
          >
            {savingParent ? 'Saving…' : 'Save and go home'}
          </button>
        </form>

        <hr />

        {/* Children list */}
        <div className="flex flex-col gap-4">
          <h2 className="font-medium text-sm text-gray-700">Children</h2>

          {children.length === 0 && (
            <p className="text-sm text-gray-400">No children added yet.</p>
          )}

          {children.map(child => (
            <div key={child.id} className="border rounded p-3 flex flex-col gap-2">
              {editingId === child.id ? (
                <>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Name"
                    className="border rounded px-3 py-1.5 text-sm"
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Future email"
                    className="border rounded px-3 py-1.5 text-sm"
                  />
                  <input
                    type="date"
                    value={editForm.birthday}
                    onChange={e => setEditForm(f => ({ ...f, birthday: e.target.value }))}
                    className="border rounded px-3 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(child.id)}
                      className="text-sm bg-indigo-600 text-white rounded px-3 py-1"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-sm text-gray-400 underline"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{child.name}</p>
                    {child.email && <p className="text-xs text-gray-400">{child.email}</p>}
                    {child.birthday && (
                      <p className="text-xs text-gray-400">
                        b. {new Date(child.birthday + 'T12:00:00').toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(child)}
                      className="text-xs text-indigo-600 underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteChild(child.id)}
                      className="text-xs text-red-400 underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add child form */}
          <form onSubmit={addChild} className="border rounded p-3 flex flex-col gap-2 bg-gray-50">
            <p className="text-xs font-medium text-gray-500">Add a child</p>
            <input
              type="text"
              required
              placeholder="Name"
              value={newChild.name}
              onChange={e => setNewChild(f => ({ ...f, name: e.target.value }))}
              className="border rounded px-3 py-1.5 text-sm"
            />
            <input
              type="email"
              placeholder="Future email (optional)"
              value={newChild.email}
              onChange={e => setNewChild(f => ({ ...f, email: e.target.value }))}
              className="border rounded px-3 py-1.5 text-sm"
            />
            <input
              type="date"
              placeholder="Birthday (optional)"
              value={newChild.birthday}
              onChange={e => setNewChild(f => ({ ...f, birthday: e.target.value }))}
              className="border rounded px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={addingChild || !newChild.name.trim()}
              className="text-sm bg-gray-800 text-white rounded px-3 py-1.5 disabled:opacity-50 self-start"
            >
              {addingChild ? 'Adding…' : '+ Add child'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
