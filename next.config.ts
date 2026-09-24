import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow cross-origin requests from ngrok tunnels and local network IPs in development
  allowedDevOrigins: [
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
    '*.ngrok-pro.app',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
};

export default nextConfig;
