import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HabitWallet",
  applicationName: "HabitWallet",
  description:
    "Offline-first habit and personal finance tracking built for Bangladeshi mobile users.",
  metadataBase: new URL("https://habitwallet.afsbd.tech"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://habitwallet.afsbd.tech",
    siteName: "HabitWallet",
    title: "HabitWallet",
    description:
      "Offline-first habit and personal finance tracking built for Bangladeshi mobile users.",
    images: [
      {
        url: "/logo/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "HabitWallet logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HabitWallet",
    description:
      "Offline-first habit and personal finance tracking built for Bangladeshi mobile users.",
    images: ["/logo/android-chrome-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/logo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/logo/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HabitWallet",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#161d20" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
