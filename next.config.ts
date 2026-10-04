import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The default indicator covers the site's social links during local reviews.
  devIndicators: false,
  // Pin the workspace root to this project. There's another lockfile higher up
  // in the home directory, and without this Next.js may infer the wrong root.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
