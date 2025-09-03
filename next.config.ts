import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
        protocol: 'https',
      },
      {
        hostname: '8fjjn0zxz3gwdgis.public.blob.vercel-storage.com',
        protocol: 'https',
      },
    ],
  },
}

export default nextConfig
