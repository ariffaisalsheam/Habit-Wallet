declare module "next-pwa" {
  import type { NextConfig } from "next";

  type WithPWAOptions = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    clientsClaim?: boolean;
    cleanupOutdatedCaches?: boolean;
    runtimeCaching?: Array<Record<string, unknown>>;
  };

  type WithPWA = (config?: NextConfig) => NextConfig;

  export default function withPWAInit(options?: WithPWAOptions): WithPWA;
}
