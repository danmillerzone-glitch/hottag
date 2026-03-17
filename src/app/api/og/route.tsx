import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'promotion' or 'wrestler'
  const slug = searchParams.get('slug')

  if (!slug || !type) {
    return new Response('Missing type or slug', { status: 400 })
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
            backgroundColor: '#14181c',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ff6b35, #ffd700, #ff6b35)',
            }}
          />

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

          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '32px',
              fontSize: '20px',
              fontWeight: 700,
              color: '#ff6b35',
              letterSpacing: '1px',
            }}
          >
            HOT TAG
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
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
            backgroundColor: '#14181c',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ff6b35, #ffd700, #ff6b35)',
            }}
          />

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
                &ldquo;{moniker}&rdquo;
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

          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '32px',
              fontSize: '20px',
              fontWeight: 700,
              color: '#ff6b35',
              letterSpacing: '1px',
            }}
          >
            HOT TAG
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  return new Response('Invalid type', { status: 400 })
}
