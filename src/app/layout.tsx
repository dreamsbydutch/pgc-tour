import "@/styles/globals.css";

import { type Metadata } from "next";
import { Barlow_Condensed, Varela, Yellowtail } from "next/font/google";

import Script from "next/script";
import { AuthProvider } from "@providers/AuthProvider";
import { TRPCReactProvider } from "@trpcLocal/react";
import { LoadSeasonalData } from "@store/loadSeasonalData";
import ServiceWorkerRegistration from "@components/smartComponents/pwa/ServiceWorkerRegistration";
import { getAuthFromHeaders } from "@supabase/auth-helpers";
import { NavigationProvider } from "@providers/NavProvider";
import { cn } from "@lib/utils/core";

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
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/logo192.png" },
    { rel: "apple-touch-startup-image", url: "/logo512.png" },
  ],
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "mobile-web-app-title": "PGC Clubhouse",
    "apple-mobile-web-app-title": "PGC Clubhouse",
    "theme-color": "#059669",
    "google-site-verification": "k_L19BEXJjcWOM7cHFMPMpK9MBdcv2uQ6qFt3HGPEbc",
  },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, member } = await getAuthFromHeaders();

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
          <AuthProvider initialUser={user} member={member}>
            <ServiceWorkerRegistration />
            <LoadSeasonalData />
            <NavigationProvider>
              <main className="mx-auto mb-24 mt-4 max-w-4xl lg:mb-8 lg:mt-20">
                <div className="5 mx-0">{children}</div>
              </main>
            </NavigationProvider>
          </AuthProvider>
        </TRPCReactProvider>

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
