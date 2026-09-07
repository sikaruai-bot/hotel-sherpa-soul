import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";
import JsonLd from "@/components/public/JsonLd";
import { Suspense } from "react";
import { PmsProvider } from "@/context/PmsContext";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  themeColor: "#d97706",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://hotelsherpasoul.com"),
  title: {
    default: "Hotel Sherpa Soul | Peaceful & Affordable Hotel in Thamel, Kathmandu",
    template: "%s | Hotel Sherpa Soul Thamel",
  },
  description: "Hotel Sherpa Soul in Thamel, Kathmandu. A tranquil sanctuary for trekkers, backpackers, couples and digital nomads. 'No Restaurant. No Noise. Sleep Well.' 6 clean guest rooms & shared kitchen for long stays.",
  keywords: [
    "Hotel Sherpa Soul",
    "Hotel in Thamel Kathmandu",
    "Quiet hotel Thamel",
    "Budget hotel Kathmandu",
    "Affordable accommodation Thamel",
    "Hotel with shared kitchen Kathmandu",
    "Backpacker hotel Kathmandu",
    "Trekker accommodation Thamel Nepal"
  ],
  authors: [{ name: "Hotel Sherpa Soul" }],
  creator: "Hotel Sherpa Soul",
  publisher: "Hotel Sherpa Soul",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hotelsherpasoul.com",
    siteName: "Hotel Sherpa Soul",
    title: "Hotel Sherpa Soul | Peaceful & Affordable Stay in Thamel, Kathmandu",
    description: "Comfortable, clean, and tranquil hotel in Thamel. No Restaurant. No Noise. Sleep Well. 6 sellable guest rooms & shared kitchen.",
    images: [
      {
        url: "/images/doubleBedRoom.jpeg",
        width: 1200,
        height: 800,
        alt: "Hotel Sherpa Soul Thamel Kathmandu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotel Sherpa Soul | Thamel, Kathmandu, Nepal",
    description: "Quiet and affordable hotel in Thamel. No Restaurant. No Noise. Sleep Well.",
    images: ["/images/doubleBedRoom.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://hotelsherpasoul.com",
  },
};

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1952950858737501";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-50 min-h-screen text-slate-900 antialiased selection:bg-amber-100 selection:text-amber-900`}>
        {/* Meta Pixel NoScript Direct Fallback */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        <PmsProvider>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <JsonLd />
          {children}
        </PmsProvider>
      </body>
    </html>
  );
}
