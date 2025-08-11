/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'aigentci-visualization-dev.s3.amazonaws.com',
      's3.amazonaws.com'
    ],
    unoptimized: true
  },
}

module.exports = nextConfig