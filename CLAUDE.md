# JOYN — Claude Code Product Brief

## What is JOYN?

JOYN is an in-person community mobile web app for East London. The tagline is "Less scrolling. More showing up." Anti-Facebook Groups — no feeds, no scrolling, no algorithms. Real people, real places.

Ships as a PWA — no App Store. Add to home screen.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Backend / Auth | Supabase |
| Hosting | Vercel |
| Payments | Stripe |
| Language | TypeScript |

Supabase project: joyn-app | org: JOYN | region: Europe London
Vercel: slingala23's projects | GitHub: slingala23/joyn-app

---

## Two Domains, One Codebase

joyn.uk → User app
organise.joyn.uk → Organiser portal

Same Next.js repo, same Vercel deployment. middleware.ts checks hostname and routes accordingly.

---

## Folder Structure

/app/(user)/discover, /event/[id], /community/[id], /activity, /profile
/app/(organiser)/dashboard, /sessions, /sessions/create, /sessions/[id], /community, /analytics, /share/[id]
/app/(admin)/admin
/app/api/auth, /api/stripe
/components/ui, /user, /organiser
/lib/supabase, /stripe
/middleware.ts

---

## Database Schema

users: id (uuid, FK auth.users), name, email, avatar_url, location, interests[], role ('user'|'organiser'|'admin'), stripe_account_id, created_at

communities: id, name, description, category, location, organiser_id (FK users), member_count, verified, created_at

events: id, community_id, organiser_id, title, description, location, date (timestamptz), price_pence (0=free), capacity, spots_taken, waitlist_enabled, members_only, status ('draft'|'published'|'cancelled'), stripe_price_id, created_at

event_joins: id, event_id, user_id, status ('confirmed'|'waitlist'|'cancelled'|'no_show'), stripe_payment_intent_id, joined_at. UNIQUE(event_id, user_id)

community_members: id, community_id, user_id, joined_at. UNIQUE(community_id, user_id)

org_requests: id, user_id, community_name, category, description, location, status ('pending'|'approved'|'declined'), created_at

Enable RLS on all tables. Users read/write own data. Organisers read their community members. Admin bypasses all RLS.

---

## Authentication

Supabase Auth magic link (no password). After login check users.role:
- user → /discover
- organiser → organise.joyn.uk/dashboard  
- admin → /admin

Middleware protects all routes.

---

## User App Screens

Discover: event cards, category filter, map toggle, spots/price/friends shown
Event Detail: fill rate bar, attendees, join/book button, share
Communities: Yours + Explore tabs
My Activity: personal bookings and history
Profile: name, photo, interests, payments, notifications

---

## Organiser Portal Screens

Dashboard: stats, upcoming sessions, activity feed
Create Session: 4-step (details > pricing > capacity > confirm)
Session Detail: attendees, message, edit, cancel, share
Community: members, announcements
Analytics: fill rate, no-show, heatmap, velocity, revenue
Super Admin: approve/decline organiser requests

---

## Payments

Free events: just event_joins row.
Paid events: Stripe Checkout → webhook → event_joins row.
JOYN adds £0.50 booking fee on top.
Organiser payouts via Stripe Connect, 1st of month.
Auto-refund if session cancelled.

---

## Brand

Coral: #F26741 | Blue: #3B9FE8 | Green: #22C55E | Ink: #1a1a1a | Surface: #faf9f7
Font: Nunito (600/700/800/900)
Radius: 16-18px cards, 50px buttons. No sharp corners.

---

## Environment Variables

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://joyn.uk
NEXT_PUBLIC_ORGANISER_URL=https://organise.joyn.uk

---

## Conventions

TypeScript everywhere (no any). Server Components by default. Supabase SSR for auth. Mobile-first 390px. No localStorage. Money in pence. Dates UTC, display as Europe/London. Use date-fns.

---

## Build Order

1. Project setup (Next.js + Tailwind + Supabase + middleware)
2. Auth (magic link, role redirects, protected routes)
3. Database (run schema, RLS policies)
4. Discover screen
5. Event detail + free join
6. Stripe paid events + webhooks
7. Organiser portal
8. Community pages
9. Analytics
10. PWA (manifest, service worker)
11. Share (OG images)
12. Admin approval queue

---

## Reference Prototypes

joyn_web_app_optimized.html — user app design reference (all screens interactive)
joyn_organiser.html — organiser portal design reference (all screens interactive)

Build to match these visually and functionally.

---

## Notes

Solo founder — keep code simple and readable. Add comments on non-obvious logic.
Primary viewport: 390px mobile. Launch market: East London.
Dummy data: Victoria Park, Hackney Marshes, East London locations.
