import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.hottag.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/map`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/wrestlers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/promotions`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/crew`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/search`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Fetch all slugs/IDs in parallel
  const [promotions, wrestlers, events, crew] = await Promise.all([
    supabase.from('promotions').select('slug, updated_at').order('updated_at', { ascending: false }),
    supabase.from('wrestlers').select('slug, updated_at').order('updated_at', { ascending: false }),
    supabase.from('events').select('id, updated_at').order('updated_at', { ascending: false }),
    supabase.from('professionals').select('slug, updated_at').order('updated_at', { ascending: false }),
  ])

  const promotionPages: MetadataRoute.Sitemap = (promotions.data || []).map((p) => ({
    url: `${BASE_URL}/promotions/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const wrestlerPages: MetadataRoute.Sitemap = (wrestlers.data || []).map((w) => ({
    url: `${BASE_URL}/wrestlers/${w.slug}`,
    lastModified: w.updated_at ? new Date(w.updated_at) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const eventPages: MetadataRoute.Sitemap = (events.data || []).map((e) => ({
    url: `${BASE_URL}/events/${e.id}`,
    lastModified: e.updated_at ? new Date(e.updated_at) : undefined,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  const crewPages: MetadataRoute.Sitemap = (crew.data || []).map((c) => ({
    url: `${BASE_URL}/crew/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...promotionPages, ...wrestlerPages, ...eventPages, ...crewPages]
}
