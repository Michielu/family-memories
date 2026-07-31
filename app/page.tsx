import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function getThisSunday(): string {
  const now = new Date()
  const diff = now.getDay() === 0 ? 0 : -now.getDay()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + diff)
  return sunday.toISOString().split('T')[0]
}

export default async function HomePage() {
  const supabase = createClient()

  const { data: config } = await supabase.from('config').select('parent_email').single()
  if (!config?.parent_email) redirect('/setup')

  const weekOf = getThisSunday()

  const [
    { data: children },
    { data: thisWeekEntries },
    { data: unsentEntries },
  ] = await Promise.all([
    supabase.from('children').select('id,name,email').order('position', { ascending: true }),
    supabase.from('weekly_entries').select('id,sent_at').eq('week_of', weekOf),
    supabase.from('weekly_entries').select('id').is('sent_at', null).order('created_at', { ascending: false }).limit(1),
  ])

  const hasSentThisWeek = (thisWeekEntries ?? []).some(e => e.sent_at !== null)
  const unsentEntry = unsentEntries && unsentEntries.length > 0 ? unsentEntries[0] : null

  const weekLabel = new Date(weekOf + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Week of {weekLabel}</p>
          <h1 className="text-xl font-semibold">Family letter</h1>
        </div>

        <div className="flex flex-col gap-3">
          {(children ?? []).map(child => {
            const hasEmail = !!child.email
            const received = hasEmail && hasSentThisWeek
            return (
              <div key={child.id} className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{child.name}</span>
                {!hasEmail ? (
                  <span className="text-xs text-gray-400">No email set</span>
                ) : received ? (
                  <span className="flex items-center gap-1 text-sm text-green-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Received
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    </svg>
                    Not yet
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {unsentEntry ? (
          <a
            href={`/week/${unsentEntry.id}`}
            className="bg-indigo-600 text-white rounded px-4 py-2.5 font-medium text-center"
          >
            Continue writing →
          </a>
        ) : (
          <p className="text-sm text-gray-400">Next letter goes out Sunday at 8pm.</p>
        )}

        <a href="/questions" className="text-sm text-indigo-600 underline">Manage questions</a>
      </div>
    </div>
  )
}
