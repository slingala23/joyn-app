'use client'

import { useState, useTransition } from 'react'
import { joinEvent } from '@/app/actions/events'

type JoinStatus = 'none' | 'confirmed' | 'waitlist' | 'full'

interface JoinButtonProps {
  eventId: string
  pricePence: number
  initialStatus: JoinStatus
  isFull: boolean
  waitlistEnabled: boolean
}

export default function JoinButton({
  eventId,
  pricePence,
  initialStatus,
  isFull,
  waitlistEnabled,
}: JoinButtonProps) {
  const [status, setStatus] = useState<JoinStatus>(initialStatus)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isFree = pricePence === 0

  function handleJoin() {
    if (!isFree) {
      // Paid flow — Stripe Checkout (Step 6)
      window.location.href = `/event/${eventId}/checkout`
      return
    }

    setErrorMsg(null)
    startTransition(async () => {
      const result = await joinEvent(eventId)

      if ('error' in result) {
        if (result.error === 'full') setStatus('full')
        else setErrorMsg('Something went wrong — try again.')
        return
      }

      setStatus(result.status)
    })
  }

  // Already in — show confirmation badge
  if (status === 'confirmed') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-full py-4 rounded-btn bg-green-joyn/10 border-2 border-green-joyn text-green-700 text-base font-extrabold text-center">
          ✓ You&apos;re going!
        </div>
        <p className="text-xs text-ink/40 font-semibold">Check My Activity for your booking</p>
      </div>
    )
  }

  if (status === 'waitlist') {
    return (
      <div className="w-full py-4 rounded-btn bg-amber-50 border-2 border-amber-400 text-amber-700 text-base font-extrabold text-center">
        ⏳ On the waitlist
      </div>
    )
  }

  // Full, no waitlist
  if (status === 'full' || (isFull && !waitlistEnabled)) {
    return (
      <div className="w-full py-4 rounded-btn bg-ink/6 text-ink/30 text-base font-extrabold text-center cursor-not-allowed">
        Event full
      </div>
    )
  }

  const label = isFull && waitlistEnabled
    ? 'Join waitlist'
    : isFree
    ? "Join — it's free"
    : `Book · £${(pricePence / 100).toFixed(2)}`

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleJoin}
        disabled={isPending}
        className="w-full py-4 rounded-btn bg-coral text-white text-base font-extrabold tracking-wide disabled:opacity-60 active:scale-95 transition-transform"
      >
        {isPending ? 'Joining…' : label}
      </button>
      {errorMsg && (
        <p className="text-center text-sm font-semibold text-red-500">{errorMsg}</p>
      )}
    </div>
  )
}
