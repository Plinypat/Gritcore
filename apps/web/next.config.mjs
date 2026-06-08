/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gritcore/types'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['canvas'] = false;
    }
    return config;
  },
};

export default nextConfig;
