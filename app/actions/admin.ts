'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function approveOrgRequest(
  requestId: string,
  userId: string,
  communityName: string,
  category: string,
  description: string,
  location: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Use service client to bypass RLS for admin operations
  const service = createServiceClient()

  // 1. Create the community
  const { data: community, error: communityError } = await service
    .from('communities')
    .insert({
      name:         communityName,
      category,
      description,
      location,
      organiser_id: userId,
    })
    .select('id')
    .single()

  if (communityError) return { error: communityError.message }

  // 2. Promote user to organiser role
  await service.from('users').update({ role: 'organiser' }).eq('id', userId)

  // 3. Mark the request approved
  await service.from('org_requests').update({ status: 'approved' }).eq('id', requestId)

  redirect('/admin')
}

export async function declineOrgRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const service = createServiceClient()
  await service.from('org_requests').update({ status: 'declined' }).eq('id', requestId)

  redirect('/admin')
}
