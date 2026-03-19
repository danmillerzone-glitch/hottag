import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const BG_URL = 'https://auth.hottag.app/storage/v1/object/public/hottag/OG-BG.jpg'
const LOGO_URL = 'https://www.hottag.app/logo.svg'

// Fetch Inter font at build/first-request time
const interBold = fetch(
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf'
).then((res) => res.arrayBuffer())

const interRegular = fetch(
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf'
).then((res) => res.arrayBuffer())

export async function GET() {
  const [boldFont, regularFont] = await Promise.all([interBold, interRegular])
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
          position: 'relative',
          fontFamily: 'Inter',
        }}
      >
        <img
          src={BG_URL}
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(20, 24, 28, 0.75)',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <img
            src={LOGO_URL}
            width={180}
            height={135}
            style={{ marginBottom: '24px' }}
          />
          <div style={{ fontSize: '56px', fontWeight: 700, color: '#ffffff' }}>
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
        { name: 'Inter', data: boldFont, weight: 700, style: 'normal' },
        { name: 'Inter', data: regularFont, weight: 400, style: 'normal' },
      ],
    }
  )
}
