/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
