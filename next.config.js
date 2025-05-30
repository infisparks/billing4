/** @type {import('next').NextConfig} */

const nextConfig = {
  swcMinify: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH,
  images: {
    domains: [
      'images.unsplash.com',
      'i.ibb.co',
      'scontent.fotp8-1.fna.fbcdn.net',
    ],
    unoptimized: true,
  },
  // Remove experimental.appDir if it's no longer needed
  // If appDir is now default, you might not need to specify it
  // experimental: {
  //   appDir: true,
  // },
};

module.exports = nextConfig;
