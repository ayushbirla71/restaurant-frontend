/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",        // 👈 REQUIRED for static deploy

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,     // 👈 REQUIRED for static hosting
  },
};

export default nextConfig;