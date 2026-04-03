'use client'

import { useState } from 'react'

interface Props {
  eventId: string
  eventTitle: string
}

export default function ShareActions({ eventId, eventTitle }: Props) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/event/${eventId}`
    : `/event/${eventId}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: eventTitle, url })
    } else {
      handleCopy()
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleCopy}
        className="w-full bg-coral text-white font-extrabold py-4 rounded-btn text-sm active:opacity-80 transition-opacity"
      >
        {copied ? 'Link copied!' : 'Copy link'}
      </button>
      <button
        onClick={handleShare}
        className="w-full bg-ink/6 text-ink font-extrabold py-4 rounded-btn text-sm active:opacity-80 transition-opacity"
      >
        Share
      </button>
    </div>
  )
}
