import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.io",
  ],
  async headers() {
    return [{ source: "/invoice/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.acidgameshop.com",
        pathname: "/storage/slider/**",
      },
    ],
  },
};

export default nextConfig;
