import Stripe from 'stripe'

// Server-side Stripe client — only import in Server Components / Route Handlers
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// JOYN booking fee in pence (£0.50)
export const BOOKING_FEE_PENCE = 50

// Format pence to display string e.g. 500 → "£5.00", 0 → "Free"
export function formatPrice(pence: number): string {
  if (pence === 0) return 'Free'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}
