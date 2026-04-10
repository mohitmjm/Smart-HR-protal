/** @type {import('next').NextConfig} */
const nextConfig = {

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'comparevoicebucket.s3.us-east-2.amazonaws.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 300, // Increase cache TTL for better performance
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Bundle optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? 'https://portal.tielo.io, https://tielo.io, https://*.vercel.app, https://*.vercel.dev'
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, X-API-Key, X-Session-ID, X-Forwarded-For',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: process.env.NODE_ENV === 'production' ? 'true' : 'false',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
      {
        // Security headers for all pages
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self "https://portal.tielo.io" "https://tielo.io"), geolocation=(self "https://portal.tielo.io" "https://tielo.io")',
          },
        ],
      },
      {
        // Cache static assets
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache favicon
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Cache logo
        source: '/logo.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Cache other static images
        source: '/:path*\\.(ico|png|jpg|jpeg|gif|svg|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Ensure correct MIME types for Next.js static assets
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Ensure correct MIME types for Next.js JS assets
        source: '/_next/static/js/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },

  // Output optimization
  output: 'standalone',

  // Experimental features - updated for Next.js 16+
  experimental: {
    // Server actions are now stable in Next.js 15+
    // No need to explicitly enable them
    optimizeCss: true,
  },

  // Turbopack configuration - Next.js 16 uses Turbopack by default
  // Adding empty config to allow webpack config to work during migration
  turbopack: {},

  // Webpack configuration for better performance
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
        // Enable module concatenation and other optimizations
        concatenateModules: true,
        minimize: true,
        // Remove unused exports
        usedExports: true,
      };

      // Tree shaking for better performance
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Optimize for development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next'],
      };
    }

    return config;
  },

  // Subdomain routing support for portal.tielo.io
  async rewrites() {
    return [
      // Portal subdomain root
      {
        source: '/',
        destination: '/portal',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      // Portal subdomain routes
      {
        source: '/auth/:path*',
        destination: '/portal/auth/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      {
        source: '/dashboard/:path*',
        destination: '/portal/dashboard/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      {
        source: '/attendance/:path*',
        destination: '/portal/attendance/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      {
        source: '/settings/:path*',
        destination: '/portal/settings/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      {
        source: '/admin/:path*',
        destination: '/portal/admin/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      {
        source: '/leaves/:path*',
        destination: '/portal/leaves/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      {
        source: '/documents/:path*',
        destination: '/portal/documents/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      {
        source: '/profile/:path*',
        destination: '/portal/profile/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      {
        source: '/team/:path*',
        destination: '/portal/team/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      {
        source: '/notifications/:path*',
        destination: '/portal/notifications/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      // API routes should NOT be rewritten (they should stay as /api/*)
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
      // Catch-all for other portal routes (excluding API routes)
      {
        source: '/:path*',
        destination: '/portal/:path*',
        has: [{ type: 'host', value: 'portal\.tielo\.io' }],
      },
    ];
  },

  // Legacy URL redirects for backward compatibility
  async redirects() {
    return [
      // Redirect old HR portal URLs to new structure
      {
        source: '/hr/portal/:path*',
        destination: '/portal/:path*',
        permanent: false,
      },
      // Redirect old HR portal root
      {
        source: '/hr/portal',
        destination: '/portal',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
