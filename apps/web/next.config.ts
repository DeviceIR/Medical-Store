import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@medical/shared"],
  allowedDevOrigins: ["192.168.70.146", "127.0.0.1", "localhost"],
  async rewrites() {
    const api = process.env.API_PROXY ?? "http://localhost:4000";
    return [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default withNextIntl(nextConfig);
