/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    dangerouslyAllowSVG: true,
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(pdf)$/i,
      type: 'asset/resource',
    });
    return config;
  },
};

export default nextConfig; 