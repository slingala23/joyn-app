import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase Auth magic-link callback.
// After email confirmation, Supabase redirects here with a code.
// We exchange it for a session, create the user row if it's their first login,
// then redirect based on role.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if a profile row exists (may not exist on first login)
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // First login — create the user row with default role
          await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url ?? null,
            location: null,
            interests: [],
            role: 'user',
            stripe_account_id: null,
          })
        }

        const role = profile?.role ?? 'user'

        if (role === 'organiser') {
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_ORGANISER_URL!}/dashboard`)
        }
        if (role === 'admin') {
          return NextResponse.redirect(`${origin}/admin`)
        }
        return NextResponse.redirect(`${origin}/discover`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
