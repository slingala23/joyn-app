import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// Direct Supabase client — safe for edge runtime (no next/headers / cookies)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabase()

  const { data: event } = await supabase
    .from('events')
    .select('title, location, date, price_pence, capacity, spots_taken')
    .eq('id', params.id)
    .single()

  // Fallback image when event is not found
  if (!event) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            background: '#faf9f7',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 900, color: '#F26741' }}>
            JOYN
          </span>
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }

  const fillPct =
    event.capacity > 0
      ? Math.round((event.spots_taken / event.capacity) * 100)
      : 0

  const dateStr = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/London',
  })

  const price =
    event.price_pence === 0
      ? 'Free'
      : `£${(event.price_pence / 100).toFixed(2)}`

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#faf9f7',
          padding: '60px',
        }}
      >
        {/* JOYN wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'auto' }}>
          <span
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#F26741',
              letterSpacing: '-1px',
            }}
          >
            JOYN
          </span>
        </div>

        {/* Event info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#1a1a1a',
              lineHeight: 1.1,
            }}
          >
            {event.title}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              gap: '32px',
              fontSize: 28,
              color: '#1a1a1a99',
            }}
          >
            <span>📅 {dateStr}</span>
            <span>📍 {event.location}</span>
            <span>🎟 {price}</span>
          </div>

          {/* Fill-rate bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '8px',
            }}
          >
            <div
              style={{
                height: '12px',
                background: '#f0ede8',
                borderRadius: '99px',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#F26741',
                  borderRadius: '99px',
                  width: `${Math.min(fillPct, 100)}%`,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#1a1a1a66',
              }}
            >
              {fillPct}% full
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
