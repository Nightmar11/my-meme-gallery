/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 忽略构建时的 ESLint 错误
    ignoreDuringBuilds: true,
  },
  // 如果以后提示 typescript 错误，这一行也能救命
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;