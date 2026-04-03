import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-green-joyn/15 text-green-700',
  waitlist:  'bg-amber-400/15 text-amber-700',
  no_show:   'bg-ink/8 text-ink/40',
}

type JoinRow = {
  id: string
  status: string
  joined_at: string
  events: {
    id: string; title: string; date: string
    location: string; price_pence: number
  } | null
}

function EventRow({ join }: { join: JoinRow }) {
  const event = join.events!
  const zoned = toZonedTime(new Date(event.date), 'Europe/London')

  return (
    <Link
      href={`/event/${event.id}`}
      className="flex items-start gap-3 bg-white rounded-card border border-ink/5 p-4 active:bg-ink/3"
    >
      <div className="flex-shrink-0 w-11 text-center">
        <p className="text-xs font-extrabold text-ink/40 uppercase">{format(zoned, 'MMM')}</p>
        <p className="text-2xl font-black text-ink leading-none">{format(zoned, 'd')}</p>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-ink truncate">{event.title}</p>
        <p className="text-xs font-semibold text-ink/50 mt-0.5">{format(zoned, 'EEE d MMM · h:mmaaa')}</p>
        <p className="text-xs font-semibold text-ink/40 truncate">{event.location}</p>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[join.status] ?? 'bg-ink/8 text-ink/40'}`}>
          {join.status === 'no_show' ? 'No show' : join.status}
        </span>
        <span className="text-xs font-bold text-ink/40">{formatPrice(event.price_pence)}</span>
      </div>
    </Link>
  )
}

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: raw } = await supabase
    .from('event_joins')
    .select('id, status, joined_at, events(id, title, date, location, price_pence)')
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .order('joined_at', { ascending: false })

  const rows = (raw ?? []) as JoinRow[]
  const now   = new Date()

  const upcoming = rows.filter(j => j.events && new Date(j.events.date) > now)
  const past     = rows.filter(j => j.events && new Date(j.events.date) <= now)

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="py-4">
          <h1 className="text-2xl font-black text-ink tracking-tight">My Activity</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 space-y-6">
        {rows.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🗓</p>
            <p className="font-bold text-ink">No bookings yet</p>
            <p className="text-sm text-ink/50 mt-1 mb-5">Find something happening near you</p>
            <Link href="/discover" className="inline-block bg-coral text-white font-extrabold px-6 py-3 rounded-btn text-sm">
              Discover events
            </Link>
          </div>
        )}

        {upcoming.length > 0 && (
          <section>
            <p className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">Upcoming</p>
            <div className="space-y-3">
              {upcoming.map(j => <EventRow key={j.id} join={j} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <p className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">Past</p>
            <div className="space-y-3 opacity-70">
              {past.map(j => <EventRow key={j.id} join={j} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
