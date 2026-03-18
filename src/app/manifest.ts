import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hot Tag',
    short_name: 'Hot Tag',
    description: 'Discover indie wrestling events, follow your favorite wrestlers, and connect with the wrestling community.',
    start_url: '/',
    display: 'standalone',
    background_color: '#14181c',
    theme_color: '#14181c',
    orientation: 'portrait-primary',
    categories: ['entertainment', 'sports'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
