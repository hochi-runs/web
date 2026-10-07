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
  images: {
    // Radio palette sampling uses a small same-origin copy of Bandcamp artwork.
    remotePatterns: [{
      protocol: "https",
      hostname: "f4.bcbits.com",
      port: "",
      pathname: "/img/**",
      search: "",
    }],
    qualities: [75],
    maximumRedirects: 0,
  },
};

export default nextConfig;
