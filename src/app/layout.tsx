import "@/styles/globals.css";

import { type Metadata } from "next";
import { Barlow_Condensed, Varela, Yellowtail } from "next/font/google";

import { cn } from "../lib/utils";
import Script from "next/script";
import { AuthProvider } from "../lib/providers/AuthProvider";
import { TRPCReactProvider } from "../trpc/react";
import { LoadSeasonalData } from "../lib/store/loadSeasonalData";
import MenuBar from "./_components/nav/MenuBar";

const varela = Varela({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-varela",
});
const yellowtail = Yellowtail({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-yellowtail",
});
const barlow = Barlow_Condensed({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: {
    template: "%s | PGC Tour",
    default: "PGC Tour",
  },
  description: "Pure Golf Collective Fantasy Golf Tour",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/favicon.ico" },
    { rel: "apple-touch-startup-image", url: "/favicon.ico" },
  ],
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-title": "PGC Clubhouse",
    "apple-mobile-web-app-title": "PGC Clubhouse",
    "google-site-verification": "k_L19BEXJjcWOM7cHFMPMpK9MBdcv2uQ6qFt3HGPEbc",
  },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          varela.variable,
          yellowtail.variable,
          barlow.variable,
          "font-sans",
        )}
      >
        <TRPCReactProvider>
          <AuthProvider>
            <LoadSeasonalData />
            <main className="mb-24 mt-4 lg:mb-8 lg:mt-20">{children}</main>
            <MenuBar />
          </AuthProvider>
        </TRPCReactProvider>

        {/* ✅ Google Analytics Scripts */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-E7NY2W59JZ"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GN6YJK2E0Q');
          `}
        </Script>
      </body>
    </html>
  );
}
