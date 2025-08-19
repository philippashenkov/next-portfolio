import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly allow LAN dev access (adjust as needed)
  // See https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  experimental: {
    // Add other experimental options here if needed
  },
};

export default nextConfig;
