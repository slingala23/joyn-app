import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { approveOrgRequest, declineOrgRequest } from '@/app/actions/admin'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrgRequest {
  id: string
  user_id: string
  community_name: string
  category: string
  description: string
  location: string
  status: 'pending' | 'approved' | 'declined'
  created_at: string
  users: {
    name: string
    email: string
  } | null
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Auth guard — must be logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // 2. Role guard — must be admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return notFound()

  // 3. Fetch all org requests for counts + pending list
  const { data: allRequests } = await supabase
    .from('org_requests')
    .select('*, users(name, email)')
    .order('created_at', { ascending: true })

  const requests = (allRequests ?? []) as OrgRequest[]

  const pendingRequests  = requests.filter(r => r.status === 'pending')
  const approvedCount    = requests.filter(r => r.status === 'approved').length
  const declinedCount    = requests.filter(r => r.status === 'declined').length

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-ink/8 px-4 pt-safe">
        <div className="py-4">
          <p className="text-xs font-bold text-coral uppercase tracking-widest mb-0.5">Super Admin</p>
          <h1 className="text-2xl font-black text-ink">Admin</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-8 max-w-2xl mx-auto w-full">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pending"  value={pendingRequests.length} colour="text-amber-500" />
          <StatCard label="Approved" value={approvedCount}          colour="text-green-600" />
          <StatCard label="Declined" value={declinedCount}          colour="text-ink/40"   />
        </div>

        {/* Pending requests section */}
        <section>
          <h2 className="text-base font-extrabold text-ink mb-4">
            Pending Requests ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-card border border-ink/5 p-6 text-center">
              <p className="text-sm font-semibold text-ink/50">No pending requests — you're all caught up.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value, colour }: { label: string; value: number; colour: string }) {
  return (
    <div className="bg-white rounded-card border border-ink/5 p-4 text-center">
      <p className={`text-2xl font-black ${colour}`}>{value}</p>
      <p className="text-xs font-bold text-ink/50 mt-0.5">{label}</p>
    </div>
  )
}

function RequestCard({ request }: { request: OrgRequest }) {
  const submittedAt = format(new Date(request.created_at), 'd MMM yyyy')
  const requesterName  = request.users?.name  ?? 'Unknown'
  const requesterEmail = request.users?.email ?? ''

  return (
    <div className="bg-white rounded-card border border-ink/5 p-4 space-y-3">
      {/* Requester */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold text-ink">{requesterName}</p>
          <p className="text-xs font-semibold text-ink/50">{requesterEmail}</p>
        </div>
        <span className="text-xs font-semibold text-ink/40 flex-shrink-0">{submittedAt}</span>
      </div>

      {/* Community info */}
      <div>
        <p className="text-base font-black text-ink">{request.community_name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge>{request.category}</Badge>
          <span className="text-xs font-semibold text-ink/50">📍 {request.location}</span>
        </div>
      </div>

      {/* Description — max 2 lines */}
      {request.description && (
        <p className="text-sm font-semibold text-ink/60 leading-relaxed line-clamp-2">
          {request.description}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        {/* Approve form — passes all data needed to create the community */}
        <form action={approveOrgRequest.bind(null,
          request.id,
          request.user_id,
          request.community_name,
          request.category,
          request.description,
          request.location,
        )} className="flex-1">
          <button
            type="submit"
            className="w-full py-2.5 rounded-btn text-sm font-extrabold bg-green-500 text-white active:opacity-80 transition-opacity"
          >
            Approve
          </button>
        </form>

        {/* Decline form */}
        <form action={declineOrgRequest.bind(null, request.id)} className="flex-1">
          <button
            type="submit"
            className="w-full py-2.5 rounded-btn text-sm font-extrabold border-2 border-red-400 text-red-500 bg-white active:opacity-80 transition-opacity"
          >
            Decline
          </button>
        </form>
      </div>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-coral/10 text-coral">
      {children}
    </span>
  )
}
