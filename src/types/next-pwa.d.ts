declare module "next-pwa" {
  import type { NextConfig } from "next";

  type WithPWAOptions = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
  };

  type WithPWA = (config?: NextConfig) => NextConfig;

  export default function withPWAInit(options?: WithPWAOptions): WithPWA;
}
