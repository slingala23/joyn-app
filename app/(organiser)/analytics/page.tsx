import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // All organiser's events, newest first
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('organiser_id', user.id)
    .order('date', { ascending: false })

  const eventList = events ?? []

  if (eventList.length === 0) {
    return (
      <div className="flex flex-col min-h-dvh bg-surface">
        <Header />
        <main className="flex-1 px-4 pb-24 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-5xl">📊</p>
          <p className="font-black text-ink text-lg">No data yet</p>
          <p className="text-sm font-semibold text-ink/50 max-w-[240px]">
            Run your first session to see analytics.
          </p>
        </main>
      </div>
    )
  }

  const eventIds = eventList.map(e => e.id)

  // Fetch all non-cancelled joins for these events
  const { data: joins } = await supabase
    .from('event_joins')
    .select('*')
    .in('event_id', eventIds)
    .neq('status', 'cancelled')

  const joinList = joins ?? []

  // ── Aggregate stats ──────────────────────────────────────────────────────────

  // Total revenue = price_pence * spots_taken across all events
  const totalRevenuePence = eventList.reduce(
    (sum, e) => sum + e.price_pence * e.spots_taken,
    0
  )

  // Total attendees (spots_taken)
  const totalAttendees = eventList.reduce((sum, e) => sum + e.spots_taken, 0)

  // Avg fill rate — only consider past non-draft events with capacity > 0
  const now = new Date()
  const pastEvents = eventList.filter(
    e => new Date(e.date) <= now && e.status !== 'draft' && e.capacity > 0
  )
  const avgFillRate =
    pastEvents.length > 0
      ? Math.round(
          pastEvents.reduce((sum, e) => sum + e.spots_taken / e.capacity, 0) /
            pastEvents.length *
            100
        )
      : 0

  // No-show rate: no_show joins / (confirmed + no_show)
  const noShows   = joinList.filter(j => j.status === 'no_show').length
  const confirmed = joinList.filter(j => j.status === 'confirmed' || j.status === 'no_show').length
  const noShowRate = confirmed > 0 ? Math.round((noShows / confirmed) * 100) : 0

  // Best performing event by fill %
  const eventsWithFill = eventList.map(e => ({
    ...e,
    fillPct: e.capacity > 0 ? Math.round((e.spots_taken / e.capacity) * 100) : 0,
  }))
  const best = eventsWithFill.reduce(
    (top, e) => (e.fillPct > (top?.fillPct ?? -1) ? e : top),
    eventsWithFill[0]
  )

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      <Header />

      <main className="flex-1 px-4 pb-24 space-y-5">
        {/* Stats grid — 2 cols */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total revenue"
            value={formatPrice(totalRevenuePence)}
            accent={totalRevenuePence > 0}
          />
          <StatCard
            label="Total attendees"
            value={totalAttendees.toLocaleString()}
          />
          <StatCard
            label="Avg fill rate"
            value={`${avgFillRate}%`}
            accent={avgFillRate >= 70}
            sub={`${pastEvents.length} past session${pastEvents.length !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="No-show rate"
            value={`${noShowRate}%`}
            warn={noShowRate > 15}
            sub={`${noShows} of ${confirmed}`}
          />
        </div>

        {/* Best performer callout */}
        {best && best.fillPct > 0 && (
          <div className="bg-coral/8 border border-coral/15 rounded-card p-4">
            <p className="text-[10px] font-extrabold text-coral/70 uppercase tracking-widest mb-1">Best session</p>
            <p className="font-extrabold text-ink text-sm truncate">{best.title}</p>
            <p className="text-xs font-semibold text-ink/50">{best.fillPct}% full · {best.spots_taken}/{best.capacity} spots</p>
          </div>
        )}

        {/* Revenue by event */}
        <section>
          <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">
            Revenue by session
          </h2>
          <div className="space-y-2">
            {eventsWithFill.map(e => {
              const zonedDate  = toZonedTime(new Date(e.date), 'Europe/London')
              const eventRevenue = e.price_pence * e.spots_taken
              const isPast     = new Date(e.date) <= now

              return (
                <div key={e.id} className="bg-white rounded-card border border-ink/5 p-4">
                  {/* Top row: title + revenue */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-ink truncate">{e.title}</p>
                      <p className="text-[11px] font-semibold text-ink/40 mt-0.5">
                        {format(zonedDate, 'EEE d MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-extrabold ${eventRevenue > 0 ? 'text-ink' : 'text-ink/40'}`}>
                        {formatPrice(eventRevenue)}
                      </p>
                      <p className="text-[11px] font-semibold text-ink/40">
                        {e.spots_taken}/{e.capacity}
                      </p>
                    </div>
                  </div>

                  {/* Fill bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className="h-1.5 bg-ink/6 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          e.fillPct >= 90
                            ? 'bg-coral'
                            : e.fillPct >= 60
                            ? 'bg-amber-400'
                            : isPast
                            ? 'bg-ink/20'
                            : 'bg-green-joyn'
                        }`}
                        style={{ width: `${Math.min(e.fillPct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-ink/30">{e.fillPct}% fill</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
      <div className="py-4">
        <h1 className="text-xl font-black text-ink">Analytics</h1>
      </div>
    </header>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
  warn,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  warn?: boolean
}) {
  const valueColour = accent ? 'text-coral' : warn ? 'text-amber-500' : 'text-ink'
  return (
    <div className="bg-white rounded-card border border-ink/5 p-4">
      <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-black ${valueColour}`}>{value}</p>
      {sub && <p className="text-[11px] font-semibold text-ink/30 mt-0.5">{sub}</p>}
    </div>
  )
}
