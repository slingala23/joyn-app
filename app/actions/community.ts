'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function joinCommunity(communityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('community_members')
    .insert({ community_id: communityId, user_id: user.id })

  revalidatePath(`/community/${communityId}`)
  revalidatePath('/communities')
}

export async function leaveCommunity(communityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', user.id)

  revalidatePath(`/community/${communityId}`)
  revalidatePath('/communities')
}
