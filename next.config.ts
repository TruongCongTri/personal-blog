import type { NextConfig } from "next";

// Review images are served from the R2 bucket's public address; next/image
// resizes them (AVIF/WebP, right size per screen) so phones get small files.
const r2Public = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: r2Public ? [new URL(`${r2Public.replace(/\/+$/, "")}/**`)] : [],
  },
};

export default nextConfig;
