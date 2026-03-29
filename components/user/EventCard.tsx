import Link from 'next/link'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { formatPrice } from '@/lib/stripe'

interface EventCardProps {
  id: string
  title: string
  communityName: string
  category: string
  location: string
  date: string          // ISO UTC string
  pricePence: number
  capacity: number
  spotsTaken: number
  waitlistEnabled: boolean
}

// Map categories to a colour accent
const CATEGORY_COLOURS: Record<string, string> = {
  Sports:   'bg-blue-joyn/10 text-blue-joyn',
  Arts:     'bg-purple-500/10 text-purple-600',
  Music:    'bg-pink-500/10 text-pink-600',
  Food:     'bg-orange-400/10 text-orange-500',
  Outdoors: 'bg-green-joyn/10 text-green-700',
  Social:   'bg-coral/10 text-coral',
  Wellness: 'bg-teal-500/10 text-teal-600',
}

function getFillColour(pct: number) {
  if (pct >= 90) return 'bg-coral'
  if (pct >= 60) return 'bg-amber-400'
  return 'bg-green-joyn'
}

export default function EventCard({
  id, title, communityName, category, location,
  date, pricePence, capacity, spotsTaken, waitlistEnabled,
}: EventCardProps) {
  const spotsLeft = capacity - spotsTaken
  const fillPct = capacity > 0 ? Math.round((spotsTaken / capacity) * 100) : 0
  const isFull = spotsLeft <= 0

  // Display date in Europe/London timezone
  const zonedDate = toZonedTime(new Date(date), 'Europe/London')
  const dayStr  = format(zonedDate, 'EEE d MMM')   // e.g. "Sat 12 Jul"
  const timeStr = format(zonedDate, 'h:mmaaa')      // e.g. "6:30pm"

  const categoryColour = CATEGORY_COLOURS[category] ?? 'bg-ink/8 text-ink/60'

  return (
    <Link href={`/event/${id}`} className="block">
      <article className="bg-white rounded-card shadow-sm border border-ink/5 overflow-hidden active:scale-[0.98] transition-transform">
        {/* Coloured top stripe by fill urgency */}
        <div className={`h-1 w-full ${getFillColour(fillPct)}`} />

        <div className="p-4">
          {/* Category + price row */}
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColour}`}>
              {category}
            </span>
            <span className="text-sm font-extrabold text-ink">
              {formatPrice(pricePence)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-extrabold text-ink leading-snug mb-1">
            {title}
          </h3>

          {/* Community */}
          <p className="text-xs font-semibold text-ink/50 mb-3">{communityName}</p>

          {/* Meta row */}
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <rect x="3" y="4" width="18" height="18" rx="3"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              {dayStr} · {timeStr}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.25-7-11a7 7 0 1114 0c0 4.75-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>
              </svg>
              {location}
            </div>
          </div>

          {/* Fill rate bar */}
          <div className="space-y-1">
            <div className="h-1.5 bg-ink/6 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getFillColour(fillPct)}`}
                style={{ width: `${Math.min(fillPct, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-ink/40">
                {fillPct}% full
              </span>
              <span className={`text-[11px] font-extrabold ${
                isFull ? 'text-ink/40' : spotsLeft <= 5 ? 'text-coral' : 'text-ink/60'
              }`}>
                {isFull
                  ? (waitlistEnabled ? 'Join waitlist' : 'Full')
                  : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
