import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/user/EventCard'
import CategoryFilter from '@/components/user/CategoryFilter'

// Tell Next.js this page is always dynamic (reads searchParams + user session)
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { category?: string }
}

async function EventList({ category }: { category?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select(`
      id, title, location, date, price_pence,
      capacity, spots_taken, waitlist_enabled,
      communities ( name, category )
    `)
    .eq('status', 'published')
    .gt('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(40)

  // Filter by category if provided (matches on the joined community)
  if (category && category !== 'All') {
    query = query.eq('communities.category', category)
  }

  const { data: events, error } = await query

  if (error) {
    return (
      <p className="text-center text-sm text-ink/50 py-12">
        Couldn&apos;t load events. Try refreshing.
      </p>
    )
  }

  // Filter out events where the community category didn't match
  // (Supabase returns null for the join when the filter doesn't match)
  const filtered = category && category !== 'All'
    ? (events ?? []).filter((e) => e.communities !== null)
    : (events ?? [])

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-4xl mb-3">🗓</p>
        <p className="font-bold text-ink">Nothing on yet</p>
        <p className="text-sm text-ink/50 mt-1">
          Check back soon — more events are added weekly.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((event) => {
        const community = event.communities as { name: string; category: string } | null
        return (
          <EventCard
            key={event.id}
            id={event.id}
            title={event.title}
            communityName={community?.name ?? 'Community'}
            category={community?.category ?? 'Social'}
            location={event.location}
            date={event.date}
            pricePence={event.price_pence}
            capacity={event.capacity}
            spotsTaken={event.spots_taken}
            waitlistEnabled={event.waitlist_enabled}
          />
        )
      })}
    </div>
  )
}

export default function DiscoverPage({ searchParams }: PageProps) {
  const category = searchParams.category

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-black text-ink tracking-tight">JOYN</h1>
          <div className="flex items-center gap-2">
            {/* Placeholder avatar — will link to profile */}
            <div className="w-8 h-8 rounded-full bg-coral/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="pb-3">
          <Suspense>
            <CategoryFilter selected={category ?? 'All'} />
          </Suspense>
        </div>
      </header>

      {/* Event list */}
      <main className="flex-1 px-4 pt-3 pb-24">
        <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-3">
          {category && category !== 'All' ? category : 'All events'} · East London
        </p>

        <Suspense
          fallback={
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-ink/5 rounded-card animate-pulse" />
              ))}
            </div>
          }
        >
          <EventList category={category} />
        </Suspense>
      </main>
    </div>
  )
}
