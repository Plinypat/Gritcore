/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gritcore/types'],
  images: {
    domains: ['localhost', 'api.gritcore.io'],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
