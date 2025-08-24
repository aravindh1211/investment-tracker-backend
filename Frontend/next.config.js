/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
    API_TOKEN: process.env.API_TOKEN,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_URL}/:path*`,
      },
    ];
  },
}

module.exports = nextConfig