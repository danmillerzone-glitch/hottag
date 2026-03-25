import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Promotion on Hot Tag'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const BG_URL = 'https://auth.hottag.app/storage/v1/object/public/hottag/OG-BG.jpg'
const LOGO_URL = 'https://www.hottag.app/logo.svg'

const interBold = fetch(
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf'
).then((res) => res.arrayBuffer())

const interRegular = fetch(
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf'
).then((res) => res.arrayBuffer())

export default async function Image({ params }: { params: { slug: string } }) {
  const [boldFont, regularFont] = await Promise.all([interBold, interRegular])

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: promotion } = await supabase
    .from('promotions')
    .select('name, logo_url, city, state')
    .eq('slug', params.slug)
    .single()

  const name = promotion?.name || params.slug
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
                fontWeight: 700,
                color: '#ff6b35',
              }}
            >
              {name.charAt(0)}
            </div>
          )}

          <div
            style={{
              fontSize: name.length > 30 ? '36px' : '48px',
              fontWeight: 700,
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
                fontWeight: 400,
                color: '#9ca3af',
                marginTop: '12px',
              }}
            >
              {location}
            </div>
          )}
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
      ...size,
      fonts: [
        { name: 'Inter', data: boldFont, weight: 700 as const, style: 'normal' as const },
        { name: 'Inter', data: regularFont, weight: 400 as const, style: 'normal' as const },
      ],
    }
  )
}
