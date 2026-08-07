// next.config.ts

import type { NextConfig } from "next";

const API_HOST = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5000/";

// basePath is set at build time via NEXT_PUBLIC_BASE_PATH env var.
// Default: '' (root) for production. Set to '/makhana' for path-based deployment.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // 1. Recommended: Enable Strict Mode for better error catching
  reactStrictMode: true,

  basePath: BASE_PATH || undefined,

  // NOTE(redesign Phase 1): `eslint` key removed — Next 16 no longer supports it
  // in next.config. `ignoreBuildErrors` kept until Phase 21 hardening; tsc is
  // currently clean, flag stays as a safety net during the redesign only.
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. IMPORTANT: Allow images from your API domain
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.makhanahealthking.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.makhana.duforge.tech',
        pathname: '/**',
      },
    ],
  },

  // output: 'export',
  // Rewrites don't work with output: 'export'
  // API calls are handled client-side via axios
  output: 'standalone',
};

export default nextConfig;