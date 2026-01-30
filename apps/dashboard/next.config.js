/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use standalone output for Docker builds (set STANDALONE=true in Docker)
  output: process.env.STANDALONE === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@glamo/shared'],
  images: {
    domains: ['localhost', 'glamo.app', 'storage.googleapis.com', 'res.cloudinary.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001'],
    },
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
