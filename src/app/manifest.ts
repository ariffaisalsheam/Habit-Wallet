import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HabitWallet",
    short_name: "HabitWallet",
    description: "Offline-first habit and finance tracking for Bangladeshi mobile users.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9f8",
    theme_color: "#1f6b4a",
    icons: [
      {
        src: "/logo/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
