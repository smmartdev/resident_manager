import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['typeorm', 'reflect-metadata', 'mysql2'],
};

export default nextConfig;