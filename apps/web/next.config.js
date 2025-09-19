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

  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components', '@/lib', 'lucide-react', 'framer-motion'],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Support for PDF.js worker, Canvas, and performance optimizations
  webpack: (config, { dev, isServer, webpack }) => {
    // Only disable canvas on the client side, allow it on server side
    if (!isServer) {
      config.resolve.alias.canvas = false;
    }

    // Performance optimizations
    if (!dev) {
      // Enable SWC minification and optimization
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Framework chunk for React/Next.js
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true,
              reuseExistingChunk: true,
            },
            // UI components chunk
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/](components|ui)[\\/]/,
              priority: 30,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            // Enterprise-specific chunk
            enterprise: {
              name: 'enterprise',
              chunks: 'all',
              test: /[\\/](enterprise|dashboard)[\\/]/,
              priority: 25,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Common chunk for shared utilities
            common: {
              name: 'common',
              chunks: 'all',
              test: /[\\/](lib|utils|hooks)[\\/]/,
              priority: 15,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Tree shaking optimizations
      config.optimization.providedExports = true;
      config.optimization.usedExports = true;

      // Module concatenation
      config.optimization.concatenateModules = true;

      // Minimize bundle size
      config.resolve.alias = {
        ...config.resolve.alias,
        // Replace large libraries with lighter alternatives where possible
        'date-fns': 'date-fns/esm',
        'lodash': 'lodash-es',
      };
    }

    // Disable problematic worker modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'worker_threads': false,
      'worker-loader': false
    };

    // Performance monitoring in development
    if (dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          __DEV__: true,
          __PERFORMANCE_MONITORING__: true,
        })
      );
    }

    // Bundle analyzer (only when ANALYZE=true)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? 'server-bundle-report.html' : 'client-bundle-report.html',
        })
      );
    }

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