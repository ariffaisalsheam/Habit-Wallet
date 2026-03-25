import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const defaultRuntimeCaching = require("next-pwa/cache");

const runtimeCaching = defaultRuntimeCaching.map((entry: Record<string, unknown>) => {
  const options = entry.options as Record<string, unknown> | undefined;
  const cacheName = typeof options?.cacheName === "string" ? options.cacheName : "";

  if (cacheName === "others") {
    return {
      ...entry,
      handler: "NetworkOnly",
      options: {
        ...(options ?? {}),
        networkTimeoutSeconds: 3,
      },
    };
  }

  if (cacheName === "apis") {
    return {
      ...entry,
      options: {
        ...(options ?? {}),
        networkTimeoutSeconds: 5,
      },
    };
  }

  return entry;
});

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  runtimeCaching,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  turbopack: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
