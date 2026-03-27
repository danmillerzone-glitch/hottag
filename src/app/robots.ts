import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/api/', '/onboarding', '/map/record'],
    },
    sitemap: 'https://www.hottag.app/sitemap.xml',
  }
}
