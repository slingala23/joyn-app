import Link from 'next/link'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/stripe'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch organiser's community
  const { data: community } = await supabase
    .from('communities')
    .select('id, name, member_count, verified')
    .eq('organiser_id', user.id)
    .single()

  // Fetch all organiser's events
  const { data: events } = await supabase
    .from('events')
    .select('id, title, date, capacity, spots_taken, price_pence, status, location')
    .eq('organiser_id', user.id)
    .order('date', { ascending: false })

  const now = new Date()
  const upcoming = (events ?? []).filter(e => e.status === 'published' && new Date(e.date) > now)
  const past     = (events ?? []).filter(e => new Date(e.date) <= now && e.status !== 'draft')

  // Stats
  const totalMembers  = community?.member_count ?? 0
  const totalSessions = past.length
  const avgFill = past.length > 0
    ? Math.round(past.reduce((sum, e) => sum + (e.capacity > 0 ? e.spots_taken / e.capacity : 0), 0) / past.length * 100)
    : 0
  const revenue = (events ?? []).reduce((sum, e) => sum + (e.price_pence * e.spots_taken), 0)

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header className="px-4 pt-safe">
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">Organiser</p>
            <h1 className="text-xl font-black text-ink">{community?.name ?? 'Your Community'}</h1>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button className="text-xs font-bold text-ink/40 px-3 py-2 rounded-xl active:bg-ink/6">Sign out</button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Members" value={totalMembers.toString()} />
          <StatCard label="Sessions run" value={totalSessions.toString()} />
          <StatCard label="Avg fill rate" value={`${avgFill}%`} accent={avgFill >= 70} />
          <StatCard label="Total revenue" value={formatPrice(revenue)} />
        </div>

        {/* Quick action */}
        <Link
          href="/sessions/create"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-btn bg-coral text-white font-extrabold text-base active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M12 4v16m8-8H4"/>
          </svg>
          Create session
        </Link>

        {/* Upcoming sessions */}
        <section>
          <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-ink/40 font-semibold py-4 text-center">No upcoming sessions</p>
          ) : (
            <div className="space-y-2">
              {upcoming.slice(0, 5).map(e => (
                <SessionRow key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>

        {/* Recent past sessions */}
        {past.length > 0 && (
          <section>
            <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">Recent</h2>
            <div className="space-y-2">
              {past.slice(0, 3).map(e => (
                <SessionRow key={e.id} event={e} past />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-card border border-ink/5 p-4">
      <p className="text-xs font-bold text-ink/40 mb-1">{label}</p>
      <p className={`text-2xl font-black ${accent ? 'text-coral' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

function SessionRow({ event, past }: { event: {
  id: string; title: string; date: string; capacity: number
  spots_taken: number; price_pence: number; location: string
}, past?: boolean }) {
  const zonedDate = toZonedTime(new Date(event.date), 'Europe/London')
  const fillPct   = event.capacity > 0 ? Math.round(event.spots_taken / event.capacity * 100) : 0

  return (
    <Link href={`/sessions/${event.id}`}
      className="flex items-center gap-3 bg-white rounded-card border border-ink/5 p-3 active:scale-[0.98] transition-transform"
    >
      {/* Fill indicator */}
      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
        past ? 'bg-ink/15' : fillPct >= 90 ? 'bg-coral' : fillPct >= 60 ? 'bg-amber-400' : 'bg-green-joyn'
      }`} />
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-sm text-ink truncate">{event.title}</p>
        <p className="text-xs font-semibold text-ink/50">
          {format(zonedDate, 'EEE d MMM · h:mmaaa')}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-extrabold text-ink">{event.spots_taken}/{event.capacity}</p>
        <p className={`text-xs font-bold ${past ? 'text-ink/30' : 'text-ink/50'}`}>{fillPct}%</p>
      </div>
      <svg className="w-4 h-4 text-ink/25 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
      </svg>
    </Link>
  )
}
