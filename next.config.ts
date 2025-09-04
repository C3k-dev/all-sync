import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    env: {
      MONGO_USER: process.env.MONGO_USER,
      MONGO_PASSWORD: process.env.MONGO_PASSWORD,
      MONGO_CLUSTER: process.env.MONGO_CLUSTER,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
    experimental: {
    serverActions: {
    bodySizeLimit: '50mb'
    }
  }
};

export default nextConfig;
