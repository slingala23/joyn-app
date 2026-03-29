import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/auth/confirm']

// Organiser-subdomain public routes
const ORGANISER_PUBLIC_ROUTES = ['/login', '/auth/callback', '/auth/confirm']

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // Determine which domain we're on.
  // In production: joyn.uk vs organise.joyn.uk
  // In local dev: localhost (user) or organise.localhost (organiser)
  const isOrganiserDomain =
    hostname === 'organise.joyn.uk' ||
    hostname === 'organise.localhost' ||
    hostname.startsWith('organise.')

  // Create a response we can mutate (for cookie refresh)
  let response = NextResponse.next({ request })

  // Attach Supabase session cookie to the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session (rotates the token if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- Organiser domain routing ---
  if (isOrganiserDomain) {
    const isPublic = ORGANISER_PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

    if (!user && !isPublic) {
      // Unauthenticated → send to organiser login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Route organiser domain requests into the /organiser route group.
    // We rewrite /dashboard → /(organiser)/dashboard etc. invisibly.
    if (user && !isPublic) {
      const organiserPaths = [
        '/dashboard',
        '/sessions',
        '/community',
        '/analytics',
        '/share',
      ]
      const needsRewrite = organiserPaths.some((p) => pathname.startsWith(p))
      if (needsRewrite) {
        const url = request.nextUrl.clone()
        url.pathname = pathname // Next.js App Router handles the (organiser) group
        return NextResponse.rewrite(url, { request: { headers: request.headers } })
      }
    }

    return response
  }

  // --- User domain (joyn.uk) routing ---
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If authenticated user visits root, redirect to discover
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/discover'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, manifest.json, icons/*, screenshots/*
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|screenshots|api).*)',
  ],
}
