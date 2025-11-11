import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parkit | Intelligent Parking & Charging Platform",
  description:
    "Discover real-time parking spots and EV charging stations, plan smarter routes, and orchestrate fleets with Parkit's mobility intelligence platform.",
  keywords: [
    "parking",
    "charging",
    "EV",
    "route planning",
    "fleet management",
    "mobility platform",
  ],
  openGraph: {
    title: "Parkit | Intelligent Parking & Charging Platform",
    description:
      "Parkit connects parking, charging, and routing data so drivers and fleets always find the best spot.",
    url: "https://parkit.example",
    siteName: "Parkit",
    images: [
      {
        url: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Nighttime city parking with EV charging stations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Parkit | Intelligent Parking & Charging Platform",
    description:
      "Park smarter with live availability for parking spots, EV chargers, and secure bike hubs.",
    images: [
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
