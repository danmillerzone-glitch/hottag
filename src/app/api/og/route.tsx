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
  const type = searchParams.get('type') // 'promotion', 'wrestler', or 'event'
  const slug = searchParams.get('slug')
  const id = searchParams.get('id')

  if (!type || (!slug && !id)) {
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

    try {
      const { data: event } = await supabase
        .from('events')
        .select('name, event_date, city, state, venue_name, poster_url, promotion_id')
        .eq('id', id)
        .single()

      let promoName: string | null = null
      let promoLogo: string | null = null
      if (event?.promotion_id) {
        const { data: promo } = await supabase
          .from('promotions')
          .select('name, logo_url')
          .eq('id', event.promotion_id)
          .single()
        promoName = promo?.name || null
        promoLogo = promo?.logo_url || null
      }

      const name = event?.name || 'Event'
      const date = event?.event_date
        ? new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : null
      const loc = [event?.venue_name, event?.city, event?.state].filter(Boolean).join(', ')

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
                backgroundColor: 'rgba(20, 24, 28, 0.8)',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                maxWidth: '1000px',
                padding: '0 40px',
              }}
            >
              {promoLogo ? (
                <img
                  src={promoLogo}
                  width={80}
                  height={80}
                  style={{
                    objectFit: 'contain',
                    marginBottom: '16px',
                    borderRadius: '12px',
                  }}
                />
              ) : null}

              <div
                style={{
                  fontSize: name.length > 40 ? '32px' : name.length > 25 ? '40px' : '52px',
                  fontWeight: 800,
                  color: '#ffffff',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {name}
              </div>

              {date ? (
                <div
                  style={{
                    fontSize: '26px',
                    color: '#ff6b35',
                    marginTop: '16px',
                    fontWeight: 600,
                  }}
                >
                  {date}
                </div>
              ) : null}

              {loc ? (
                <div
                  style={{
                    fontSize: '22px',
                    color: '#9ca3af',
                    marginTop: '8px',
                  }}
                >
                  {loc}
                </div>
              ) : null}

              {promoName ? (
                <div
                  style={{
                    fontSize: '20px',
                    color: '#6b7280',
                    marginTop: '12px',
                  }}
                >
                  Presented by {promoName}
                </div>
              ) : null}
            </div>

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
    } catch (e: any) {
      return new Response(`Event OG error: ${e?.message || 'unknown'}`, { status: 500 })
    }
  }

  return new Response('Invalid type', { status: 400 })
}
