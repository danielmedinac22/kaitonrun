import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/history", destination: "/historial", permanent: true },
      { source: "/insights", destination: "/historial", permanent: true },
      { source: "/settings", destination: "/ajustes", permanent: true },
    ];
  },
};

export default nextConfig;
