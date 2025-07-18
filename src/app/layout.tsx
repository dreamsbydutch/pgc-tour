import "@pgc-styles";
import { type Metadata } from "next";
import { Barlow_Condensed, Varela, Yellowtail } from "next/font/google";
import Script from "next/script";
import { cn } from "@pgc-utils";
import { AuthProvider, getAuthData } from "@pgc-auth";
import { TRPCReactProvider } from "@pgc-trpcClient";
import { ServiceWorkerRegistration } from "@pgc-components";
import { LoadSeasonalData } from "@pgc-store";
import { NavigationProvider } from "@pgc-components/Navigation";

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
    "theme-color": "#059669", // Fully Functional - Green
    // "theme-color": "#FF8C00", // Partially Functional - Orange
    // "theme-color": "#DC143C", // Non-Functional - Red
    "google-site-verification": "k_L19BEXJjcWOM7cHFMPMpK9MBdcv2uQ6qFt3HGPEbc",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Only get initial auth data for SSR - client will manage state afterwards
  const { user, member } = await getAuthData();

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
                <div className="mx-1">{children}</div>
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
