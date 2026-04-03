import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/stripe'
import JoinButton from './JoinButton'
import ShareButtonClient from './ShareButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('title, description, location')
    .eq('id', params.id)
    .single()
  if (!event) return {}
  return {
    title: event.title,
    description: event.description || event.location,
    openGraph: {
      images: [`/api/og/${params.id}`],
    },
  }
}

interface PageProps {
  params: { id: string }
  searchParams: { payment?: string; error?: string }
}

const CATEGORY_COLOURS: Record<string, string> = {
  Sports:   'bg-blue-joyn/10 text-blue-joyn',
  Arts:     'bg-purple-500/10 text-purple-600',
  Music:    'bg-pink-500/10 text-pink-600',
  Food:     'bg-orange-400/10 text-orange-500',
  Outdoors: 'bg-green-joyn/10 text-green-700',
  Social:   'bg-coral/10 text-coral',
  Wellness: 'bg-teal-500/10 text-teal-600',
}

function getFillColour(pct: number) {
  if (pct >= 90) return 'bg-coral'
  if (pct >= 60) return 'bg-amber-400'
  return 'bg-green-joyn'
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const paymentSuccess = searchParams.payment === 'success'
  const supabase = await createClient()

  // Fetch event with community
  const { data: event } = await supabase
    .from('events')
    .select('*, communities(id, name, category, location, member_count, verified)')
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (!event) notFound()

  // Check current user's join status
  const { data: { user } } = await supabase.auth.getUser()
  let joinStatus: 'none' | 'confirmed' | 'waitlist' | 'full' = 'none'

  if (user) {
    const { data: join } = await supabase
      .from('event_joins')
      .select('status')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .single()

    if (join) joinStatus = join.status as typeof joinStatus
  }

  const community = event.communities as {
    id: string; name: string; category: string; location: string
    member_count: number; verified: boolean
  } | null

  const spotsLeft    = event.capacity - event.spots_taken
  const fillPct      = event.capacity > 0 ? Math.round((event.spots_taken / event.capacity) * 100) : 0
  const eventIsFull  = spotsLeft <= 0

  // ?payment=success: Stripe redirected back — treat as confirmed optimistically
  // while the webhook processes in the background (usually < 1s)
  if (paymentSuccess && joinStatus === 'none') joinStatus = 'confirmed'

  const zonedDate = toZonedTime(new Date(event.date), 'Europe/London')
  const dayStr    = format(zonedDate, 'EEEE d MMMM yyyy')
  const timeStr   = format(zonedDate, 'h:mmaaa')

  const categoryColour = CATEGORY_COLOURS[community?.category ?? ''] ?? 'bg-ink/8 text-ink/60'

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Sticky back header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/discover"
            className="flex items-center gap-1 text-sm font-bold text-ink/60 -ml-1 px-2 py-1 rounded-xl active:bg-ink/6"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Discover
          </Link>

          {/* Share button */}
          <ShareButton title={event.title} />
        </div>
      </header>

      <main className="flex-1 px-4 pb-36">
        {/* Category + title */}
        <div className="mt-1 mb-4">
          {community && (
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${categoryColour}`}>
              {community.category}
            </span>
          )}
          <h1 className="text-2xl font-black text-ink leading-tight">{event.title}</h1>
          {community && (
            <Link href={`/community/${community.id}`} className="inline-flex items-center gap-1 mt-1">
              <span className="text-sm font-bold text-coral">{community.name}</span>
              {community.verified && (
                <svg className="w-3.5 h-3.5 text-blue-joyn" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </Link>
          )}
        </div>

        {/* Meta card */}
        <div className="bg-white rounded-card border border-ink/5 p-4 space-y-3 mb-4">
          <MetaRow
            icon={<CalendarIcon />}
            text={`${dayStr} · ${timeStr}`}
          />
          <MetaRow
            icon={<LocationIcon />}
            text={event.location}
          />
          <MetaRow
            icon={<TicketIcon />}
            text={formatPrice(event.price_pence)}
            bold
          />
        </div>

        {/* Fill rate */}
        <div className="bg-white rounded-card border border-ink/5 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-ink">
              {event.spots_taken} / {event.capacity} going
            </span>
            <span className={`text-sm font-extrabold ${
              eventIsFull ? 'text-ink/40' : spotsLeft <= 5 ? 'text-coral' : 'text-ink/60'
            }`}>
              {eventIsFull
                ? (event.waitlist_enabled ? 'Join waitlist' : 'Full')
                : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
            </span>
          </div>
          <div className="h-2.5 bg-ink/6 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getFillColour(fillPct)}`}
              style={{ width: `${Math.min(fillPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="bg-white rounded-card border border-ink/5 p-4 mb-4">
            <h2 className="text-sm font-extrabold text-ink mb-2 uppercase tracking-wide">About</h2>
            <p className="text-sm font-semibold text-ink/70 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        )}
      </main>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-surface/95 backdrop-blur-sm border-t border-ink/8 px-4 pt-3 pb-safe z-50">
        <JoinButton
          eventId={event.id}
          pricePence={event.price_pence}
          initialStatus={joinStatus}
          isFull={eventIsFull}
          waitlistEnabled={event.waitlist_enabled}
        />
      </div>
    </div>
  )
}

// ── Small helper components ────────────────────────────────────────────────

function MetaRow({ icon, text, bold }: { icon: React.ReactNode; text: string; bold?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-ink/40 mt-0.5 flex-shrink-0">{icon}</span>
      <span className={`text-sm leading-snug ${bold ? 'font-extrabold text-ink' : 'font-semibold text-ink/70'}`}>
        {text}
      </span>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <rect x="3" y="4" width="18" height="18" rx="3"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.25-7-11a7 7 0 1114 0c0 4.75-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
    </svg>
  )
}

function ShareButton({ title }: { title: string }) {
  return <ShareButtonClient title={title} />
}
