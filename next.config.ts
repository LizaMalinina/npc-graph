import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // For Docker production builds
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net', // Azure Blob Storage
      },
      {
        protocol: 'https',
        hostname: '**', // Allow any external images
      },
    ],
  },
};

export default nextConfig;
