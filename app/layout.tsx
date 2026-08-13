import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bucketlistadventure.in"),
  title: {
    default: "Bucketlist Adventure | Trekking, Trips & Himalayan Escapes",
    template: "%s | Bucketlist Adventure",
  },
  description:
    "Curated treks, Himalayan escapes, and adventure trips across India. We plan it. You live it.",
  keywords: [
    "trekking",
    "adventure trips",
    "Himalayan travel",
    "Sahyadri treks",
    "Ladakh trip",
    "Bucketlist Adventure",
  ],
  openGraph: {
    title: "Bucketlist Adventure",
    description:
      "Curated treks, Himalayan escapes, and adventure trips across India.",
    url: "https://bucketlistadventure.in",
    siteName: "Bucketlist Adventure",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
