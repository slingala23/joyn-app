'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type JoinResult =
  | { status: 'confirmed' | 'waitlist'; alreadyJoined: boolean }
  | { error: 'full' | 'event_not_found' | 'event_not_published' | 'unauthenticated' | 'unknown' }

export async function joinEvent(eventId: string): Promise<JoinResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const { data, error } = await supabase.rpc('join_event', {
    p_event_id: eventId,
    p_user_id: user.id,
  })

  if (error) return { error: 'unknown' }

  const result = data as { status?: string; error?: string; already_joined?: boolean }

  if (result.error) {
    return { error: result.error as JoinResult extends { error: infer E } ? E : never }
  }

  // Revalidate pages that show spot counts
  revalidatePath(`/event/${eventId}`)
  revalidatePath('/discover')

  return {
    status: result.status as 'confirmed' | 'waitlist',
    alreadyJoined: result.already_joined ?? false,
  }
}
