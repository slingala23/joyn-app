import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase Auth magic-link callback.
// After email confirmation, Supabase redirects here with a code.
// We exchange it for a session, then redirect based on the user's role.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Fetch the user's role to redirect them to the right place
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role ?? 'user'

        if (role === 'organiser') {
          const organiserUrl = process.env.NEXT_PUBLIC_ORGANISER_URL!
          return NextResponse.redirect(`${organiserUrl}/dashboard`)
        }
        if (role === 'admin') {
          return NextResponse.redirect(`${origin}/admin`)
        }
        // Default: user → discover
        return NextResponse.redirect(`${origin}/discover`)
      }
    }
  }

  // If something went wrong, send back to login with an error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
