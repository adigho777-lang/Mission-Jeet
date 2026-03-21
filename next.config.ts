import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'decicqog4ulhy.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'dxixtlyravvxx.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'missionjeet.in',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;
