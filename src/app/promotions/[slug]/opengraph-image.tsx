import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Promotion on Hot Tag'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: { slug: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: promotion } = await supabase
    .from('promotions')
    .select('name, logo_url, city, state')
    .eq('slug', params.slug)
    .single()

  const name = promotion?.name || 'Promotion'
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
        {/* Subtle gradient accent at bottom */}
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

        {/* Logo */}
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

        {/* Promotion name */}
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

        {/* Location */}
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

        {/* Hot Tag branding */}
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
    { ...size }
  )
}
