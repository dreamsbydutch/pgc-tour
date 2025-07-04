import "@/styles/globals.css";

import { type Metadata } from "next";
import { Barlow_Condensed, Varela, Yellowtail } from "next/font/google";

import { TRPCReactProvider } from "@/trpcLocal/react";
import MenuBar from "@/src/app/_components/nav/MenuBar";
import { cn } from "../lib/utils";
import Script from "next/script";
import { AuthProvider } from "../lib/auth/Auth";

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
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="k_L19BEXJjcWOM7cHFMPMpK9MBdcv2uQ6qFt3HGPEbc"
        />
        <meta name="mobile-web-app-capable" content="yes"></meta>
        <meta name="apple-mobile-web-app-capable" content="yes"></meta>
        <link rel="apple-touch-icon" href="/favicon.ico"></link>
        <link rel="apple-touch-startup-image" href="/favicon.ico"></link>
        <meta name="mobile-web-app-title" content="PGC Clubhouse"></meta>
        <meta name="apple-mobile-web-app-title" content="PGC Clubhouse"></meta>

        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-E7NY2W59JZ"
        />

        <Script id="google-analytics">
          {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-GN6YJK2E0Q');
          `}
        </Script>
      </head>
      <body
        className={cn(
          varela.variable,
          yellowtail.variable,
          barlow.variable,
          "font-sans",
        )}
      >        <TRPCReactProvider>
          <AuthProvider>
              <main className="mb-24 mt-4 lg:mb-8 lg:mt-20">{children}</main>
              <MenuBar />
          </AuthProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
