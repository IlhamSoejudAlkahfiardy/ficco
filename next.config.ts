import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Expose DEVELOPMENT to client-side code even when defined without NEXT_PUBLIC_
  env: {
    DEVELOPMENT: process.env.DEVELOPMENT,
  },
  // Allow cross-origin requests from ngrok tunnels and local network IPs in development
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
    '*.ngrok-pro.app',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
