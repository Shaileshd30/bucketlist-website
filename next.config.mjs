/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    turbopack: false,
  },
  webpack: (config) => config,
};

export default nextConfig;
