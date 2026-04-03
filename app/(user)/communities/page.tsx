import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Category pill colour mapping
function categoryStyle(category: string): string {
  switch (category.toLowerCase()) {
    case 'sports':
      return 'bg-blue-joyn/10 text-blue-joyn'
    case 'outdoors':
      return 'bg-green-joyn/10 text-green-joyn'
    default:
      // Social and anything else → coral
      return 'bg-coral/10 text-coral'
  }
}

interface Community {
  id: string
  name: string
  description: string
  category: string
  location: string
  member_count: number
  verified: boolean
}

function CommunityCard({ community }: { community: Community }) {
  return (
    <Link href={`/community/${community.id}`}>
      <article className="bg-white rounded-card border border-ink/5 p-4 active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-extrabold text-ink text-base leading-tight flex-1">
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

        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-btn ${categoryStyle(community.category)}`}
          >
            {community.category}
          </span>
          <span className="text-xs text-ink/40">{community.member_count} members</span>
        </div>

        <p className="text-sm text-ink/60 mt-2 line-clamp-2 leading-snug">
          {community.description}
        </p>

        <p className="text-xs text-ink/40 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM2 6a6 6 0 1110.89 3.477l2.817 2.816a.75.75 0 01-1.06 1.061L11.83 10.54A6 6 0 012 6z"
              clipRule="evenodd"
            />
          </svg>
          {/* Plain pin icon */}
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a5 5 0 00-5 5c0 3 5 9 5 9s5-6 5-9a5 5 0 00-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
          {community.location}
        </p>
      </article>
    </Link>
  )
}

interface PageProps {
  searchParams: { tab?: string }
}

export default async function CommunitiesPage({ searchParams }: PageProps) {
  const tab = searchParams.tab === 'yours' ? 'yours' : 'explore'

  const supabase = await createClient()

  // Get current user (optional — page works for logged-out users too)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all communities ordered by popularity
  const { data: allCommunities } = await supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false })

  const communities = (allCommunities ?? []) as Community[]

  // Fetch the user's joined community IDs
  let joinedIds: Set<string> = new Set()
  if (user) {
    const { data: memberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
    for (const m of memberships ?? []) {
      joinedIds.add(m.community_id)
    }
  }

  const yourCommunities = communities.filter((c) => joinedIds.has(c.id))
  const displayList = tab === 'yours' ? yourCommunities : communities

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="py-4">
          <h1 className="text-2xl font-black text-ink tracking-tight">Communities</h1>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 pb-3">
          <Link
            href="/communities?tab=explore"
            className={`flex-1 text-center text-sm font-bold py-2 rounded-btn transition-colors ${
              tab === 'explore'
                ? 'bg-ink text-surface'
                : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
            }`}
          >
            Explore
          </Link>
          <Link
            href="/communities?tab=yours"
            className={`flex-1 text-center text-sm font-bold py-2 rounded-btn transition-colors ${
              tab === 'yours'
                ? 'bg-ink text-surface'
                : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
            }`}
          >
            Yours
            {yourCommunities.length > 0 && (
              <span className="ml-1.5 bg-coral text-white text-xs font-black rounded-full px-1.5 py-px">
                {yourCommunities.length}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Community list */}
      <main className="flex-1 px-4 pt-2 pb-24 space-y-3">
        {displayList.length === 0 ? (
          <div className="text-center py-20 px-4">
            {tab === 'yours' ? (
              <>
                <p className="text-4xl mb-3">🏘️</p>
                <p className="font-bold text-ink">No communities yet</p>
                <p className="text-sm text-ink/50 mt-1">
                  You haven&apos;t joined any communities yet.
                </p>
                <Link
                  href="/communities?tab=explore"
                  className="inline-block mt-4 bg-coral text-white font-bold text-sm px-6 py-2.5 rounded-btn"
                >
                  Explore communities
                </Link>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-bold text-ink">No communities found</p>
                <p className="text-sm text-ink/50 mt-1">Check back soon.</p>
              </>
            )}
          </div>
        ) : (
          displayList.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))
        )}
      </main>
    </div>
  )
}
