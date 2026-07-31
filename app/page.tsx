import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function getThisSunday(): string {
  const now = new Date()
  const diff = now.getDay() === 0 ? 0 : -now.getDay()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + diff)
  return sunday.toISOString().split('T')[0]
}

async function createAndOpenEntry(weekOf: string) {
  'use server'
  const supabase = createClient()
  const { data: entry } = await supabase
    .from('weekly_entries')
    .insert({ week_of: weekOf })
    .select('id')
    .single()
  if (entry?.id) redirect(`/week/${entry.id}`)
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

  const createEntry = createAndOpenEntry.bind(null, weekOf)

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#5f5c6e] mb-2">
            Week of {weekLabel}
          </p>
          <h1 className="font-hedvig text-4xl text-[#130e30] leading-tight">
            Family<br />letter
          </h1>
        </div>

        <div className="bg-[#eff2e5] rounded-3xl px-6 py-5 flex flex-col gap-4">
          {(children ?? []).map(child => {
            const hasEmail = !!child.email
            const received = hasEmail && hasSentThisWeek
            return (
              <div key={child.id} className="flex items-center justify-between">
                <span className="font-medium text-[#130e30]">{child.name}</span>
                {!hasEmail ? (
                  <span className="text-xs text-[#5f5c6e]">No email set</span>
                ) : received ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Received
                  </span>
                ) : (
                  <span className="text-sm text-[#5f5c6e]">Not yet</span>
                )}
              </div>
            )
          })}
        </div>

        {unsentEntry ? (
          <a
            href={`/week/${unsentEntry.id}`}
            className="bg-[#ffe228] text-[#130e30] rounded-full px-6 py-3 font-medium text-center"
          >
            Continue writing →
          </a>
        ) : hasSentThisWeek ? (
          <form action={createEntry}>
            <button type="submit" className="w-full border border-[#130e30] text-[#130e30] rounded-full px-6 py-3 font-medium">
              Write another letter this week
            </button>
          </form>
        ) : (
          <form action={createEntry}>
            <button type="submit" className="w-full bg-[#ffe228] text-[#130e30] rounded-full px-6 py-3 font-medium">
              Start this week&apos;s letter
            </button>
          </form>
        )}

        <a href="/questions" className="text-sm text-[#5f5c6e] underline underline-offset-2">
          Manage questions
        </a>
      </div>
    </div>
  )
}
