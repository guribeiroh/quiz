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
  // Desabilitar verificações de tipo TypeScript durante o build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Desabilitar verificações do ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig; 