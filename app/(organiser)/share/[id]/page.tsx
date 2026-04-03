import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/stripe'
import ShareActions from './ShareActions'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

function getFillColour(pct: number) {
  if (pct >= 90) return 'bg-coral'
  if (pct >= 60) return 'bg-amber-400'
  return 'bg-green-joyn'
}

export default async function SharePage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: event } = await supabase
    .from('events')
    .select('*, communities(name)')
    .eq('id', params.id)
    .eq('organiser_id', user.id)
    .single()

  if (!event) notFound()

  const community = event.communities as { name: string } | null
  const zoned     = toZonedTime(new Date(event.date), 'Europe/London')
  const dateStr   = format(zoned, 'EEEE d MMMM')
  const timeStr   = format(zoned, 'h:mmaaa')
  const fillPct   = event.capacity > 0 ? Math.round((event.spots_taken / event.capacity) * 100) : 0
  const spotsLeft = event.capacity - event.spots_taken

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="flex items-center gap-3 py-4">
          <Link
            href={`/sessions/${params.id}`}
            className="flex items-center gap-1 text-sm font-bold text-ink/60 -ml-1 px-2 py-1 rounded-xl active:bg-ink/6"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-lg font-black text-ink">Share</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24">
        {/* Share preview card */}
        <div className="bg-white rounded-2xl border border-ink/8 overflow-hidden mb-6 shadow-sm">
          {/* Card header — coral accent bar */}
          <div className="h-2 bg-coral" />

          <div className="p-5">
            {/* JOYN logo */}
            <p className="text-xs font-black text-coral tracking-widest uppercase mb-4">JOYN · East London</p>

            {/* Event title */}
            <h2 className="text-2xl font-black text-ink leading-tight mb-1">{event.title}</h2>
            {community && (
              <p className="text-sm font-bold text-coral mb-4">{community.name}</p>
            )}

            {/* Meta */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                <svg className="w-4 h-4 text-ink/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <rect x="3" y="4" width="18" height="18" rx="3"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                {dateStr} · {timeStr}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                <svg className="w-4 h-4 text-ink/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.25-7-11a7 7 0 1114 0c0 4.75-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>
                </svg>
                {event.location}
              </div>
              <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
                <svg className="w-4 h-4 text-ink/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                </svg>
                {formatPrice(event.price_pence)}
              </div>
            </div>

            {/* Fill bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-ink/50">{event.spots_taken} going</span>
                <span className="text-xs font-extrabold text-ink/50">
                  {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                </span>
              </div>
              <div className="h-2 bg-ink/6 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getFillColour(fillPct)}`}
                  style={{ width: `${Math.min(fillPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card footer */}
          <div className="px-5 pb-4">
            <p className="text-xs font-bold text-ink/30 text-center">joyn.uk · Less scrolling. More showing up.</p>
          </div>
        </div>

        {/* Share actions */}
        <ShareActions eventId={params.id} eventTitle={event.title} />
      </main>
    </div>
  )
}
