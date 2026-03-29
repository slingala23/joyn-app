'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (a: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/sessions',
    label: 'Sessions',
    icon: (a: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <rect x="3" y="4" width="18" height="18" rx="3"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    href: '/community',
    label: 'Community',
    icon: (a: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4 6v-2m0 0a4 4 0 100-8 4 4 0 000 8zm-8-4a2 2 0 11-4 0 2 2 0 014 0zm16 0a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (a: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
  },
]

export default function OrgNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-white border-t border-ink/8 pb-safe z-50">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${active ? 'text-coral' : 'text-ink/40'}`}
            >
              {icon(active)}
              <span className={`text-[10px] font-bold tracking-wide ${active ? 'text-coral' : 'text-ink/40'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
