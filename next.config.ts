import type { NextConfig } from "next";

/**
 * Where the Next.js dev/prod server should forward requests that start with `/api`.
 *
 * This value is read on the server only (never shipped to the browser), so it may
 * point at a private address. Override it with API_PROXY_TARGET in .env.local.
 *
 * Forwarding through the Next server keeps browser requests same-origin, which
 * removes CORS from the equation entirely. If you would rather call the backend
 * directly, set NEXT_PUBLIC_API_URL to its full URL in .env.local instead.
 */
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "http://localhost:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
