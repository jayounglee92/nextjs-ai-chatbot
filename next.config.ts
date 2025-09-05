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
    // 로컬 개발 환경에서만 이미지 최적화 비활성화
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

export default nextConfig
