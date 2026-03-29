import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .eq('organiser_id', user.id) // organisers can only see their own
    .single()

  if (!event) notFound()

  // Fetch confirmed attendees with their profile info
  const { data: joins } = await supabase
    .from('event_joins')
    .select('id, status, joined_at, users(name, email, avatar_url)')
    .eq('event_id', event.id)
    .neq('status', 'cancelled')
    .order('joined_at', { ascending: true })

  const confirmed  = (joins ?? []).filter(j => j.status === 'confirmed')
  const waitlisted = (joins ?? []).filter(j => j.status === 'waitlist')
  const fillPct    = event.capacity > 0 ? Math.round(event.spots_taken / event.capacity * 100) : 0
  const zonedDate  = toZonedTime(new Date(event.date), 'Europe/London')
  const isPast     = new Date(event.date) < new Date()

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="flex items-center gap-2 py-4">
          <Link href="/sessions" className="-ml-1 p-1 rounded-xl active:bg-ink/6">
            <svg className="w-5 h-5 text-ink/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <h1 className="flex-1 text-lg font-black text-ink truncate">{event.title}</h1>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
            event.status === 'published' ? 'bg-green-joyn/10 text-green-700'
            : event.status === 'cancelled' ? 'bg-red-500/10 text-red-600'
            : 'bg-ink/8 text-ink/50'
          }`}>{event.status}</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 space-y-4">
        {/* Event meta */}
        <div className="bg-white rounded-card border border-ink/5 p-4 space-y-2.5">
          <MetaRow icon="📅" text={`${format(zonedDate, 'EEEE d MMMM yyyy')} · ${format(zonedDate, 'h:mmaaa')}`} />
          <MetaRow icon="📍" text={event.location} />
          <MetaRow icon="🎟" text={formatPrice(event.price_pence)} bold />
        </div>

        {/* Fill rate */}
        <div className="bg-white rounded-card border border-ink/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-extrabold text-ink">{event.spots_taken} / {event.capacity} spots filled</span>
            <span className={`text-sm font-extrabold ${fillPct >= 90 ? 'text-coral' : 'text-ink/60'}`}>{fillPct}%</span>
          </div>
          <div className="h-2.5 bg-ink/6 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${fillPct >= 90 ? 'bg-coral' : fillPct >= 60 ? 'bg-amber-400' : 'bg-green-joyn'}`}
              style={{ width: `${Math.min(fillPct, 100)}%` }} />
          </div>
        </div>

        {/* Attendees */}
        <section>
          <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">
            Confirmed ({confirmed.length})
          </h2>
          {confirmed.length === 0 ? (
            <p className="text-sm text-ink/40 font-semibold py-2 text-center">No attendees yet</p>
          ) : (
            <div className="bg-white rounded-card border border-ink/5 divide-y divide-ink/5">
              {confirmed.map((j) => {
                const attendee = j.users as { name: string; email: string; avatar_url: string | null } | null
                return (
                  <div key={j.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-coral/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-extrabold text-coral">
                        {(attendee?.name ?? 'A')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-ink truncate">{attendee?.name ?? 'Unknown'}</p>
                      <p className="text-xs font-semibold text-ink/40 truncate">{attendee?.email}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {waitlisted.length > 0 && (
          <section>
            <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">Waitlist ({waitlisted.length})</h2>
            <div className="bg-white rounded-card border border-ink/5 divide-y divide-ink/5">
              {waitlisted.map((j) => {
                const attendee = j.users as { name: string; email: string } | null
                return (
                  <div key={j.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-extrabold text-amber-600">{(attendee?.name ?? 'A')[0].toUpperCase()}</span>
                    </div>
                    <p className="text-sm font-extrabold text-ink">{attendee?.name ?? 'Unknown'}</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* Actions — only for future published sessions */}
      {!isPast && event.status === 'published' && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-surface/95 backdrop-blur-sm border-t border-ink/8 px-4 pt-3 pb-safe z-50">
          <CancelButton eventId={event.id} />
        </div>
      )}
    </div>
  )
}

function MetaRow({ icon, text, bold }: { icon: string; text: string; bold?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base">{icon}</span>
      <span className={`text-sm leading-snug ${bold ? 'font-extrabold text-ink' : 'font-semibold text-ink/70'}`}>{text}</span>
    </div>
  )
}

// Inline server action for cancel
function CancelButton({ eventId }: { eventId: string }) {
  async function cancelEvent() {
    'use server'
    const supabase = await createClient()
    await supabase.from('events').update({ status: 'cancelled' }).eq('id', eventId)
    redirect('/sessions')
  }

  return (
    <form action={cancelEvent}>
      <button type="submit"
        className="w-full py-3.5 rounded-btn border-2 border-red-500/30 text-red-600 font-extrabold text-sm active:scale-95 transition-transform"
      >
        Cancel session
      </button>
    </form>
  )
}
