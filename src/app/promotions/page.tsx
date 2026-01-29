import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPromotions } from '@/lib/supabase'
import { Building2, MapPin, ExternalLink, Twitter } from 'lucide-react'
import { getTwitterUrl } from '@/lib/utils'

export const revalidate = 300

async function PromotionsList() {
  const promotions = await getPromotions(50)

  // Group by region
  const byRegion = promotions.reduce((acc, promo) => {
    const region = promo.region || 'Other'
    if (!acc[region]) acc[region] = []
    acc[region].push(promo)
    return acc
  }, {} as Record<string, typeof promotions>)

  const regionOrder = [
    'National',
    'Texas',
    'California',
    'Pacific Northwest',
    'Midwest',
    'New England',
    'Northeast',
    'Southeast',
    'Florida',
    'Other',
  ]

  const sortedRegions = Object.keys(byRegion).sort((a, b) => {
    const aIndex = regionOrder.indexOf(a)
    const bIndex = regionOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return (
    <div className="space-y-12">
      {sortedRegions.map((region) => (
        <div key={region}>
          <h2 className="text-xl font-display font-bold mb-4 text-foreground-muted">
            {region}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byRegion[region].map((promo) => (
              <Link
                key={promo.id}
                href={`/promotions/${promo.slug}`}
                className="card p-5 hover:border-accent/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Logo placeholder */}
                  <div className="w-16 h-16 rounded-lg bg-background-tertiary flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {promo.logo_url ? (
                      <Image
                        src={promo.logo_url}
                        alt={promo.name}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-foreground-muted" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                      {promo.name}
                    </h3>
                    
                    {(promo.city || promo.state) && (
                      <div className="flex items-center gap-1 text-sm text-foreground-muted mt-1">
                        <MapPin className="w-3 h-3" />
                        {promo.city}{promo.city && promo.state && ', '}{promo.state}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      {promo.twitter_handle && (
                        <a
                          href={getTwitterUrl(promo.twitter_handle) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-foreground-muted hover:text-accent transition-colors"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {promo.website && (
                        <a
                          href={promo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-foreground-muted hover:text-accent transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PromotionsListSkeleton() {
  return (
    <div className="space-y-12">
      {[1, 2, 3].map((region) => (
        <div key={region}>
          <div className="h-6 w-32 skeleton mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 skeleton rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 skeleton" />
                    <div className="h-4 w-24 skeleton" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PromotionsPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Promotions</h1>
          <p className="text-foreground-muted">
            Independent wrestling promotions across the United States
          </p>
        </div>

        {/* List */}
        <Suspense fallback={<PromotionsListSkeleton />}>
          <PromotionsList />
        </Suspense>
      </div>
    </div>
  )
}
