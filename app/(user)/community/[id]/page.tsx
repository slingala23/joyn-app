import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/stripe'
import JoinCommunityButton from './JoinCommunityButton'

export const dynamic = 'force-dynamic'

const LONDON_TZ = 'Europe/London'

function categoryStyle(category: string): string {
  switch (category.toLowerCase()) {
    case 'sports':
      return 'bg-blue-joyn/10 text-blue-joyn'
    case 'outdoors':
      return 'bg-green-joyn/10 text-green-joyn'
    default:
      return 'bg-coral/10 text-coral'
  }
}

interface PageProps {
  params: { id: string }
}

export default async function CommunityPage({ params }: PageProps) {
  const supabase = await createClient()

  // Fetch the community
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!community) notFound()

  // Current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Upcoming published events for this community
  const now = new Date().toISOString()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('community_id', params.id)
    .eq('status', 'published')
    .gt('date', now)
    .order('date', { ascending: true })
    .limit(10)

  // Check if current user is a member
  let isMember = false
  if (user) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()
    isMember = !!membership
  }

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe flex items-center gap-3 py-4">
        <Link
          href="/communities"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 shrink-0"
          aria-label="Back to communities"
        >
          <svg className="w-4 h-4 text-ink" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
        </Link>
        <h1 className="font-black text-ink text-lg truncate flex-1">{community.name}</h1>
      </header>

      <main className="flex-1 px-4 pb-24 space-y-6">
        {/* Hero card */}
        <div className="bg-white rounded-card border border-ink/5 p-5">
          {/* Name + verified */}
          <div className="flex items-start gap-2">
            <h2 className="text-xl font-black text-ink leading-tight flex-1">
              {community.name}
            </h2>
            {community.verified && (
              <svg
                className="w-5 h-5 text-blue-joyn shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-label="Verified"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* Category + location */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-btn ${categoryStyle(community.category)}`}
            >
              {community.category}
            </span>
            <span className="text-xs text-ink/40 flex items-center gap-0.5">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a5 5 0 00-5 5c0 3 5 9 5 9s5-6 5-9a5 5 0 00-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
              {community.location}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-ink/70 mt-3 leading-relaxed">{community.description}</p>

          {/* Member count */}
          <p className="text-xs font-bold text-ink/40 mt-3">
            {community.member_count.toLocaleString()} members
          </p>

          {/* Join / Leave */}
          <div className="mt-4">
            <JoinCommunityButton
              communityId={community.id}
              isMember={isMember}
              isAuthed={!!user}
            />
          </div>
        </div>

        {/* Upcoming events */}
        <section>
          <h3 className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-3">
            Upcoming events
          </h3>

          {!events || events.length === 0 ? (
            <div className="bg-white rounded-card border border-ink/5 p-6 text-center">
              <p className="text-sm text-ink/50">No upcoming events.</p>
              <p className="text-xs text-ink/30 mt-1">Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => {
                const zonedDate = toZonedTime(new Date(event.date), LONDON_TZ)
                const dateStr = format(zonedDate, 'EEE d MMM · h:mm a')
                const spotsLeft = event.capacity - event.spots_taken

                return (
                  <Link
                    key={event.id}
                    href={`/event/${event.id}`}
                    className="flex items-center justify-between bg-white rounded-card border border-ink/5 px-4 py-3 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-ink text-sm leading-tight truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-ink/40 mt-0.5">{dateStr}</p>
                      <p className="text-xs text-ink/40 flex items-center gap-0.5 mt-0.5">
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1a5 5 0 00-5 5c0 3 5 9 5 9s5-6 5-9a5 5 0 00-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                        {event.location}
                      </p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold text-sm text-coral">
                        {formatPrice(event.price_pence)}
                      </p>
                      {spotsLeft <= 5 && spotsLeft > 0 && (
                        <p className="text-xs text-ink/40">{spotsLeft} left</p>
                      )}
                      {spotsLeft <= 0 && (
                        <p className="text-xs text-ink/40">Full</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
