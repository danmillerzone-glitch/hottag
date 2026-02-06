/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    minimumCacheTTL: 0,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cagematch.net',
      },
      {
        protocol: 'https',
        hostname: '**.cagematch.net',
      },
    ],
  },
}

module.exports = nextConfig
