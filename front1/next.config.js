/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: [
      'aigentci-visualization-dev.s3.amazonaws.com',
      's3.amazonaws.com'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },

  // API route configuration for long-running requests
  experimental: {
    // Increase API route timeout for Bedrock Agent requests (15 minutes)
    serverComponentsExternalPackages: ['@aws-sdk/client-bedrock-agentcore'],
  },

  // Configure API routes timeout
  async rewrites() {
    return [
      {
        source: '/api/research',
        destination: '/api/research',
        has: [
          {
            type: 'header',
            key: 'content-type',
            value: 'application/json',
          },
        ],
      },
    ];
  },

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
}

module.exports = nextConfig