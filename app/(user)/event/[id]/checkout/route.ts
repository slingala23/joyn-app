import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, BOOKING_FEE_PENCE } from '@/lib/stripe'

// GET /event/[id]/checkout — creates a Stripe Checkout Session and redirects
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = new URL(request.url).origin
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Fetch event with community name for the line-item description
  const { data: event } = await supabase
    .from('events')
    .select('*, communities(name)')
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (!event) {
    return NextResponse.redirect(`${origin}/discover`)
  }

  // Free events should use the join flow, not checkout
  if (event.price_pence === 0) {
    return NextResponse.redirect(`${origin}/event/${params.id}`)
  }

  // Check capacity — block if full and no waitlist
  if (event.spots_taken >= event.capacity && !event.waitlist_enabled) {
    return NextResponse.redirect(`${origin}/event/${params.id}?error=full`)
  }

  // Don't let the user pay twice
  const { data: existing } = await supabase
    .from('event_joins')
    .select('status')
    .eq('event_id', event.id)
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existing) {
    return NextResponse.redirect(`${origin}/event/${params.id}`)
  }

  const community = event.communities as { name: string } | null

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: event.title,
            description: [community?.name, event.location].filter(Boolean).join(' · '),
          },
          unit_amount: event.price_pence,
        },
        quantity: 1,
      },
      {
        // JOYN platform fee — shown transparently to the user
        price_data: {
          currency: 'gbp',
          product_data: { name: 'JOYN booking fee' },
          unit_amount: BOOKING_FEE_PENCE,
        },
        quantity: 1,
      },
    ],
    // Store IDs so the webhook can create the event_joins row
    metadata: {
      event_id: event.id,
      user_id: user.id,
    },
    success_url: `${origin}/event/${params.id}?payment=success`,
    cancel_url: `${origin}/event/${params.id}`,
  })

  return NextResponse.redirect(session.url!)
}
