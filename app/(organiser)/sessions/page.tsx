import Link from 'next/link'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/stripe'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-green-joyn/10 text-green-700',
  draft:     'bg-ink/8 text-ink/50',
  cancelled: 'bg-red-500/10 text-red-600',
}

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, date, capacity, spots_taken, price_pence, status, location')
    .eq('organiser_id', user.id)
    .order('date', { ascending: false })

  const now = new Date()
  const upcoming = (events ?? []).filter(e => new Date(e.date) > now)
  const past     = (events ?? []).filter(e => new Date(e.date) <= now)

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-xl font-black text-ink">Sessions</h1>
          <Link href="/sessions/create"
            className="flex items-center gap-1.5 bg-coral text-white text-sm font-extrabold px-4 py-2 rounded-btn active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M12 4v16m8-8H4"/>
            </svg>
            New
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 space-y-6">
        <Section title="Upcoming" events={upcoming} />
        <Section title="Past" events={past} past />
      </main>
    </div>
  )
}

function Section({ title, events, past }: {
  title: string
  events: Array<{ id: string; title: string; date: string; capacity: number; spots_taken: number; price_pence: number; status: string; location: string }>
  past?: boolean
}) {
  if (events.length === 0) return null

  return (
    <section>
      <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">{title}</h2>
      <div className="space-y-2">
        {events.map(e => {
          const zonedDate = toZonedTime(new Date(e.date), 'Europe/London')
          const fillPct   = e.capacity > 0 ? Math.round(e.spots_taken / e.capacity * 100) : 0
          return (
            <Link key={e.id} href={`/sessions/${e.id}`}
              className="block bg-white rounded-card border border-ink/5 p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-extrabold text-sm text-ink leading-snug flex-1">{e.title}</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[e.status] ?? STATUS_BADGE.draft}`}>
                  {e.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-ink/50 mb-3">
                {format(zonedDate, 'EEE d MMM · h:mmaaa')} · {formatPrice(e.price_pence)}
              </p>
              {/* Fill bar */}
              {!past && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-ink/6 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${fillPct >= 90 ? 'bg-coral' : fillPct >= 60 ? 'bg-amber-400' : 'bg-green-joyn'}`}
                      style={{ width: `${Math.min(fillPct, 100)}%` }} />
                  </div>
                  <p className="text-[11px] font-bold text-ink/40">{e.spots_taken}/{e.capacity} spots · {fillPct}% full</p>
                </div>
              )}
              {past && (
                <p className="text-[11px] font-bold text-ink/30">{e.spots_taken} attended · {fillPct}% fill</p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
