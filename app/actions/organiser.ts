'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface SessionFormData {
  title: string
  description: string
  date: string       // 'YYYY-MM-DD'
  time: string       // 'HH:mm'
  location: string
  isFree: boolean
  pricePounds: string
  capacity: string
  waitlistEnabled: boolean
  membersOnly: boolean
}

type CreateResult = { error: string } | never

export async function createSession(data: SessionFormData): Promise<CreateResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch the organiser's community
  const { data: community } = await supabase
    .from('communities')
    .select('id')
    .eq('organiser_id', user.id)
    .single()

  if (!community) return { error: 'No community found. Contact support.' }

  const pricePence = data.isFree ? 0 : Math.round(parseFloat(data.pricePounds) * 100)
  const capacity   = parseInt(data.capacity, 10)

  if (isNaN(capacity) || capacity < 1) return { error: 'Capacity must be at least 1' }
  if (!data.isFree && isNaN(pricePence)) return { error: 'Invalid price' }

  // Combine date + time into a UTC ISO string (input is Europe/London local time)
  const localDatetime = `${data.date}T${data.time}:00`
  // We store as-is and rely on the display layer to convert; Supabase stores timestamptz.
  // For a production app, use a proper tz conversion here.
  const dateUtc = new Date(localDatetime).toISOString()

  const { data: inserted, error } = await supabase
    .from('events')
    .insert({
      community_id:     community.id,
      organiser_id:     user.id,
      title:            data.title.trim(),
      description:      data.description.trim(),
      location:         data.location.trim(),
      date:             dateUtc,
      price_pence:      pricePence,
      capacity,
      spots_taken:      0,
      waitlist_enabled: data.waitlistEnabled,
      members_only:     data.membersOnly,
      status:           'published',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/sessions/${inserted.id}`)
}
