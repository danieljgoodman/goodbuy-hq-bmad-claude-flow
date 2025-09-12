/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  typedRoutes: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Support for PDF.js worker
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  // Enable static file serving for PDF workers + Security headers
  async headers() {
    return [
      {
        source: '/pdf.worker.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      {
        source: '/pdf.worker.legacy.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig