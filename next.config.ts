import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  sassOptions: {
    // ソースマップ（.mapファイル）の生成を無効化
    sourceMap: false,
  },
};

export default nextConfig;
