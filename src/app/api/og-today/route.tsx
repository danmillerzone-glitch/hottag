import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Fetch Inter fonts at build/first-request time
const interBlack = fetch(
  'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuBWYMZg.ttf'
).then((res) => res.arrayBuffer())

const interBold = fetch(
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf'
).then((res) => res.arrayBuffer())

const interRegular = fetch(
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf'
).then((res) => res.arrayBuffer())

export async function GET() {
  const [blackFont, boldFont, regularFont] = await Promise.all([interBlack, interBold, interRegular])
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' })
  const todayFormatted = new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('event_date', today)
    .eq('status', 'upcoming')

  const showCount = count || 0
  const subtitle = showCount > 0
    ? `${showCount} ${showCount === 1 ? 'show' : 'shows'} tonight`
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#14181c',
          fontFamily: 'Inter',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle radial glow behind content */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '300px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 53, 0.12) 0%, transparent 70%)',
          }}
        />
        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #ff6b35, transparent)',
          }}
        />
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* "HT" text logo instead of external image */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                fontSize: '88px',
                fontWeight: 900,
                color: '#ff6b35',
                letterSpacing: '-2px',
              }}
            >
              HOT TAG
            </div>
          </div>
          <div style={{ fontSize: '56px', fontWeight: 900, color: '#ffffff' }}>
            {"Today's Events"}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 400, color: '#ff6b35', marginTop: '16px' }}>
            {todayFormatted}
          </div>
          {subtitle ? (
            <div style={{ fontSize: '22px', fontWeight: 400, color: '#9ca3af', marginTop: '12px' }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=900, s-maxage=900' },
      fonts: [
        { name: 'Inter', data: blackFont, weight: 900, style: 'normal' },
        { name: 'Inter', data: boldFont, weight: 700, style: 'normal' },
        { name: 'Inter', data: regularFont, weight: 400, style: 'normal' },
      ],
    }
  )
}
