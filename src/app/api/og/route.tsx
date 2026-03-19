import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const BG_URL = 'https://auth.hottag.app/storage/v1/object/public/hottag/OG-BG.jpg'
const LOGO_URL = 'https://www.hottag.app/logo.svg'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'promotion', 'wrestler', 'event', or 'today'
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')

  if (!type || (type !== 'today' && !slug && !id)) {
    return new Response('Missing type or slug/id', { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  if (type === 'promotion') {
    const { data: promotion } = await supabase
      .from('promotions')
      .select('name, logo_url, city, state')
      .eq('slug', slug)
      .single()

    const name = promotion?.name || slug
    const logoUrl = promotion?.logo_url || null
    const location = [promotion?.city, promotion?.state].filter(Boolean).join(', ')

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
            position: 'relative',
          }}
        >
          {/* Background image */}
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

          {/* Dark overlay for readability */}
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

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                width={200}
                height={200}
                style={{
                  objectFit: 'contain',
                  marginBottom: '24px',
                  borderRadius: '16px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '16px',
                  backgroundColor: '#2a3038',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  fontSize: '80px',
                  color: '#ff6b35',
                }}
              >
                {name.charAt(0)}
              </div>
            )}

            <div
              style={{
                fontSize: name.length > 30 ? '36px' : '48px',
                fontWeight: 800,
                color: '#ffffff',
                textAlign: 'center',
                maxWidth: '900px',
                lineHeight: 1.2,
              }}
            >
              {name}
            </div>

            {location && (
              <div
                style={{
                  fontSize: '24px',
                  color: '#9ca3af',
                  marginTop: '12px',
                }}
              >
                {location}
              </div>
            )}
          </div>

          {/* Hot Tag logo watermark */}
          <img
            src={LOGO_URL}
            width={100}
            height={75}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '24px',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      }
    )
  }

  if (type === 'wrestler') {
    const { data: wrestler } = await supabase
      .from('wrestlers')
      .select('name, photo_url, render_url, moniker, hometown')
      .eq('slug', slug)
      .single()

    const name = wrestler?.name || slug
    const imageUrl = wrestler?.render_url || wrestler?.photo_url || null
    const moniker = wrestler?.moniker || null
    const hometown = wrestler?.hometown || null

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Background image */}
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

          {/* Dark overlay */}
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

          {/* Content */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '48px',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  width={280}
                  height={350}
                  style={{
                    objectFit: 'cover',
                    borderRadius: '16px',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '280px',
                    height: '350px',
                    borderRadius: '16px',
                    backgroundColor: '#2a3038',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '120px',
                    color: '#ff6b35',
                  }}
                >
                  {name.charAt(0)}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                maxWidth: '600px',
              }}
            >
              <div
                style={{
                  fontSize: name.length > 20 ? '44px' : '56px',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.1,
                }}
              >
                {name}
              </div>

              {moniker && (
                <div
                  style={{
                    fontSize: '24px',
                    color: '#ff6b35',
                    marginTop: '8px',
                    fontStyle: 'italic',
                  }}
                >
                  {`\u201C${moniker}\u201D`}
                </div>
              )}

              {hometown && (
                <div
                  style={{
                    fontSize: '22px',
                    color: '#9ca3af',
                    marginTop: '12px',
                  }}
                >
                  {hometown}
                </div>
              )}
            </div>
          </div>

          {/* Hot Tag logo watermark */}
          <img
            src={LOGO_URL}
            width={100}
            height={75}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '24px',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      }
    )
  }

  if (type === 'event') {
    if (!id) return new Response('Missing id for event', { status: 400 })

    const { data: event } = await supabase
      .from('events')
      .select('name, event_date, city, state, venue_name, promotion_id')
      .eq('id', id)
      .single()

    let logoUrl: string | null = null
    let subtitle = ''
    if (event?.promotion_id) {
      const { data: promo } = await supabase
        .from('promotions')
        .select('name, logo_url')
        .eq('id', event.promotion_id)
        .single()
      logoUrl = promo?.logo_url || null
      if (promo?.name) subtitle = promo.name
    }

    const name = event?.name || 'Event'
    const dateLine = event?.event_date
      ? new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : ''
    const locationLine = [event?.venue_name, event?.city, event?.state].filter(Boolean).join(', ')
    const location = [dateLine, locationLine].filter(Boolean).join(' • ')

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
            position: 'relative',
          }}
        >
          {/* Background image */}
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

          {/* Dark overlay for readability */}
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

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                width={120}
                height={120}
                style={{
                  objectFit: 'contain',
                  marginBottom: '24px',
                  borderRadius: '16px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '16px',
                  backgroundColor: '#2a3038',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  fontSize: '50px',
                  color: '#ff6b35',
                }}
              >
                {name.charAt(0)}
              </div>
            )}

            <div
              style={{
                fontSize: name.length > 40 ? '32px' : name.length > 25 ? '40px' : '48px',
                fontWeight: 800,
                color: '#ffffff',
                textAlign: 'center',
                maxWidth: '900px',
                lineHeight: 1.2,
              }}
            >
              {name}
            </div>

            {location && (
              <div
                style={{
                  fontSize: '22px',
                  color: '#ff6b35',
                  marginTop: '12px',
                }}
              >
                {location}
              </div>
            )}

            {subtitle && (
              <div
                style={{
                  fontSize: '20px',
                  color: '#9ca3af',
                  marginTop: '8px',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Hot Tag logo watermark */}
          <img
            src={LOGO_URL}
            width={100}
            height={75}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '24px',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      }
    )
  }

  if (type === 'today') {
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
          }}
        >
          <div style={{ fontSize: '56px', fontWeight: 800, color: '#ffffff' }}>
            Todays Events
          </div>
          <div style={{ fontSize: '28px', color: '#ff6b35', marginTop: '16px' }}>
            {todayFormatted}
          </div>
          {subtitle ? (
            <div style={{ fontSize: '22px', color: '#9ca3af', marginTop: '12px' }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'no-cache' },
      }
    )
  }

  return new Response('Invalid type', { status: 400 })
}
