import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const name     = (profile as { name?: string } | null)?.name ?? user.email ?? 'You'
  const email    = user.email ?? ''
  const interests = (profile as { interests?: string[] } | null)?.interests ?? []
  const joinedAt  = user.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : ''
  const initials  = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm px-4 pt-safe">
        <div className="py-4">
          <h1 className="text-2xl font-black text-ink tracking-tight">Profile</h1>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 space-y-4">
        {/* Avatar + name */}
        <div className="bg-white rounded-card border border-ink/5 p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-coral/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-black text-coral">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-ink truncate">{name}</p>
            <p className="text-sm font-semibold text-ink/50 truncate">{email}</p>
            {joinedAt && (
              <p className="text-xs font-semibold text-ink/30 mt-0.5">Member since {joinedAt}</p>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-card border border-ink/5 p-4">
          <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-widest mb-3">Interests</h2>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: string) => (
                <span key={interest} className="bg-coral/10 text-coral text-xs font-extrabold px-3 py-1.5 rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-ink/40">No interests added yet</p>
          )}
        </div>

        {/* Account */}
        <div className="bg-white rounded-card border border-ink/5 divide-y divide-ink/5">
          <div className="px-4 py-3">
            <h2 className="text-xs font-extrabold text-ink/40 uppercase tracking-widest">Account</h2>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Email notifications</span>
            <span className="text-xs font-bold text-ink/30">On</span>
          </div>
          <div className="px-4 py-3">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full text-center text-sm font-extrabold text-coral py-1"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
