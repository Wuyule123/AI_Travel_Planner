import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // 添加这一行，用于 Docker 部署
};

export default nextConfig;