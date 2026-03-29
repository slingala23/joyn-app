import { type NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

// Stripe requires the raw body to verify the webhook signature
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  // Service role — bypasses RLS so we can write on behalf of the paying user
  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session)
      break
    }

    case 'checkout.session.expired': {
      // Nothing to do — user didn't pay, no join row was created
      break
    }

    case 'charge.refunded': {
      // A refund was issued (e.g. organiser cancelled the event).
      // Mark the join as cancelled so the spot can be re-offered.
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id

      if (paymentIntentId) {
        await supabase
          .from('event_joins')
          .update({ status: 'cancelled' })
          .eq('stripe_payment_intent_id', paymentIntentId)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  const eventId = session.metadata?.event_id
  const userId  = session.metadata?.user_id
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id

  if (!eventId || !userId) {
    console.error('webhook: checkout.session.completed missing metadata', session.id)
    return
  }

  // Attempt insert — unique constraint (event_id, user_id) makes this idempotent.
  // If the row already exists (duplicate webhook), the insert is skipped.
  const { data: inserted, error } = await supabase
    .from('event_joins')
    .insert({
      event_id: eventId,
      user_id: userId,
      status: 'confirmed',
      stripe_payment_intent_id: paymentIntentId ?? null,
    })
    .select('id')
    .single()

  if (error) {
    // 23505 = unique_violation — row already exists, webhook already processed
    if (error.code === '23505') return
    console.error('webhook: failed to insert event_join', error.message)
    return
  }

  if (inserted) {
    // Increment spots_taken directly — service role bypasses RLS.
    // raw SQL increment avoids read-modify-write race conditions.
    await supabase.rpc('increment_spots_taken', { p_event_id: eventId })
  }
}
