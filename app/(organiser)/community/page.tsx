import Link from 'next/link'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function OrganiserCommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch the organiser's community
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('organiser_id', user.id)
    .single()

  if (!community) {
    return (
      <div className="flex flex-col min-h-dvh bg-surface">
        <header className="px-4 pt-safe">
          <div className="py-4">
            <h1 className="text-xl font-black text-ink">Community</h1>
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-4xl">🏘️</p>
          <p className="font-extrabold text-ink">No community yet</p>
          <p className="text-sm font-semibold text-ink/50">Your community will appear here once approved.</p>
        </main>
      </div>
    )
  }

  // Fetch members with their user profile joined in
  const { data: members } = await supabase
    .from('community_members')
    .select('id, joined_at, users(name, email, avatar_url)')
    .eq('community_id', community.id)
    .order('joined_at', { ascending: false })

  const memberList = members ?? []

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-ink leading-tight">{community.name}</h1>
                {community.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-blue-joyn/10 text-blue-joyn px-2 py-0.5 rounded-full flex-shrink-0">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-ink/50 mt-0.5">
                {community.category} · {community.location}
              </p>
            </div>
            {/* Edit button — placeholder, no action wired yet */}
            <button
              type="button"
              className="flex-shrink-0 text-xs font-extrabold text-coral border border-coral/30 px-3 py-1.5 rounded-btn active:bg-coral/5 transition-colors"
            >
              Edit info
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 space-y-5">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          <StatPill label="Members" value={community.member_count.toString()} />
          <StatPill label="Category" value={community.category} small />
          <StatPill label="Location" value={community.location} small />
        </div>

        {/* Description */}
        {community.description && (
          <div className="bg-white rounded-card border border-ink/5 p-4">
            <p className="text-sm font-semibold text-ink/70 leading-relaxed">{community.description}</p>
          </div>
        )}

        {/* Members list */}
        <section>
          <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">
            Members ({memberList.length})
          </h2>

          {memberList.length === 0 ? (
            <div className="bg-white rounded-card border border-ink/5 p-8 flex flex-col items-center gap-3 text-center">
              <p className="text-3xl">👋</p>
              <p className="font-extrabold text-ink text-sm">No members yet</p>
              <p className="text-xs font-semibold text-ink/50">
                Share your community to get your first members.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-card border border-ink/5 divide-y divide-ink/5">
              {memberList.map((m) => {
                // Supabase returns joined rows as an object; cast it explicitly
                const profile = m.users as { name: string; email: string; avatar_url: string | null } | null
                const initials = (profile?.name ?? '?')[0].toUpperCase()
                const joinedLondon = toZonedTime(new Date(m.joined_at), 'Europe/London')

                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    {/* Avatar circle — initials on coral bg */}
                    <div className="w-9 h-9 rounded-full bg-coral flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-extrabold text-white">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-ink truncate">{profile?.name ?? 'Unknown'}</p>
                      <p className="text-xs font-semibold text-ink/40 truncate">{profile?.email}</p>
                    </div>
                    <p className="text-[11px] font-semibold text-ink/30 flex-shrink-0">
                      {format(joinedLondon, 'd MMM yy')}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function StatPill({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-white rounded-card border border-ink/5 p-3 text-center">
      <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`font-extrabold text-ink truncate ${small ? 'text-xs' : 'text-xl'}`}>{value}</p>
    </div>
  )
}
