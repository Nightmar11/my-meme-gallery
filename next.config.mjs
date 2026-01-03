/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 忽略构建时的 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 如果你有 TS 文件，也忽略 TS 错误
    ignoreBuildErrors: true,
  },
};

export default nextConfig;