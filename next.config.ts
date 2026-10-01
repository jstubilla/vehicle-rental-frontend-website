import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TEST ONLY: the home backdrop photo is served from Unsplash. Remove once real photos are in /public/images.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
  },
};

export default nextConfig;
