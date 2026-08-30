import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship no browser source maps in production, so the deployed bundle stays
  // minified and unreadable (this is the Next.js default; set explicitly).
  productionBrowserSourceMaps: false,
  // Keep build output lean; no `x-powered-by` header.
  poweredByHeader: false,
};

export default nextConfig;
