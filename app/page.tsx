import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createClient()

  const { data: config } = await supabase.from('config').select('parent_email').single()
  if (!config?.parent_email) redirect('/setup')

  const { data: entry } = await supabase
    .from('weekly_entries')
    .select('id')
    .is('sent_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (entry) redirect(`/week/${entry.id}`)

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">All caught up</h1>
        <p className="text-gray-500">Your next letter goes out Sunday at 8pm.</p>
        <a href="/questions" className="text-indigo-600 underline mt-4 block">Manage questions</a>
      </div>
    </div>
  )
}
