import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { nextRuntime, webpack }) => {
    // Force single Yjs instance to prevent "Yjs was already imported" warning
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: resolve(__dirname, 'node_modules/yjs'),
    };

    // Inject server env vars into Edge Runtime bundle (middleware).
    // Non-NEXT_PUBLIC_ vars are stripped from the edge bundle at build time.
    if (nextRuntime === 'edge') {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(
            process.env.SUPABASE_SERVICE_ROLE_KEY,
          ),
          'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
          ),
        }),
      );
    }

    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  output: 'standalone',
  env: {
    APP_VERSION: pkg.version,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  async headers() {
    return [
      {
        source: '/logo/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co http://127.0.0.1:* http://localhost:*",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:*",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
