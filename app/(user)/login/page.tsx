'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redirect back to our callback handler after link is clicked
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        shouldCreateUser: true,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-6 max-w-mobile mx-auto">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-ink tracking-tight">JOYN</h1>
        <p className="mt-2 text-sm font-semibold text-ink/50 tracking-wide uppercase">
          Less scrolling. More showing up.
        </p>
      </div>

      {sent ? (
        // Sent state
        <div className="w-full text-center">
          <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {/* Envelope icon */}
            <svg className="w-8 h-8 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Check your inbox</h2>
          <p className="text-sm text-ink/60 mb-6 leading-relaxed">
            We sent a magic link to <span className="font-semibold text-ink">{email}</span>.
            Tap it to sign in — no password needed.
          </p>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="text-sm font-semibold text-coral underline underline-offset-2"
          >
            Use a different email
          </button>
        </div>
      ) : (
        // Email form
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-ink mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              inputMode="email"
              className="w-full px-4 py-3.5 rounded-[14px] border-2 border-ink/10 bg-white text-ink text-base font-semibold placeholder:text-ink/30 focus:outline-none focus:border-coral transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-500 px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-4 rounded-btn bg-coral text-white text-base font-extrabold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-opacity active:scale-95"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>

          <p className="text-center text-xs text-ink/40 pt-2 leading-relaxed">
            We&apos;ll send you a one-click sign-in link. No password, ever.
          </p>
        </form>
      )}
    </div>
  )
}
