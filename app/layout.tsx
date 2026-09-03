import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppWidget from "./components/WhatsAppWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bucketlistadventure.in"),

  title: {
    default:
      "Bucketlist Adventure | Treks, Expeditions & Adventure Travel in India",
    template: "%s | Bucketlist Adventure",
  },

  description:
    "Bucketlist Adventure creates thoughtfully planned treks, Himalayan expeditions, weekend adventures, road trips and customized journeys across India and beyond. We Plan It. You Live It.",

  applicationName: "Bucketlist Adventure",

  authors: [
    {
      name: "Bucketlist Adventure",
      url: "https://bucketlistadventure.in",
    },
  ],

  creator: "Bucketlist Adventure",
  publisher: "Bucketlist Adventure",

  keywords: [
    "Bucketlist Adventure",
    "trekking company in Pune",
    "weekend treks from Pune",
    "treks near Pune",
    "Sahyadri treks",
    "Himalayan treks",
    "Himalayan expeditions",
    "adventure travel India",
    "adventure tours India",
    "Ladakh trips",
    "Spiti Valley trips",
    "Kashmir tours",
    "Nepal treks",
    "backpacking trips India",
    "road trips India",
    "corporate outings Pune",
    "customized tours India",
    "group tours India",
  ],

  alternates: {
    canonical: "https://bucketlistadventure.in",
  },

  openGraph: {
    title:
      "Bucketlist Adventure | Treks, Expeditions & Adventure Travel",
    description:
      "Thoughtfully planned treks, Himalayan expeditions, road journeys and adventure experiences across India and beyond.",
    url: "https://bucketlistadventure.in",
    siteName: "Bucketlist Adventure",

    images: [
      {
        url: "/bucketlist-logo.png",
        width: 1200,
        height: 630,
        alt: "Bucketlist Adventure",
      },
    ],

    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Bucketlist Adventure | Treks, Expeditions & Adventure Travel",
    description:
      "Thoughtfully planned treks, Himalayan expeditions and journeys across India and beyond.",
    images: ["/bucketlist-logo.png"],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "travel",
};

const structuredData = {
  "@context": "https://schema.org",

  "@graph": [
    {
      "@type": [
        "TravelAgency",
        "Organization",
      ],

      "@id":
        "https://bucketlistadventure.in/#organization",

      name: "Bucketlist Adventure",

      legalName:
        "Bucketlist Destinations",

      url:
        "https://bucketlistadventure.in",

      logo:
        "https://bucketlistadventure.in/bucketlist-logo.png",

      image:
        "https://bucketlistadventure.in/bucketlist-logo.png",

      description:
        "Bucketlist Adventure creates thoughtfully planned treks, Himalayan expeditions, weekend adventures, road trips, corporate outings and customized journeys across India and beyond.",

      slogan:
        "We Plan It. You Live It.",

      telephone:
        "+91-92255-31257",

      email:
        "bucketlistdestinations2@gmail.com",

      address: {
        "@type":
          "PostalAddress",

        streetAddress:
          "U7/C7, Runwal Platinum, NDA Pashan Road",

        addressLocality:
          "Bavdhan",

        addressRegion:
          "Maharashtra",

        postalCode:
          "411021",

        addressCountry:
          "IN",
      },

      areaServed: [
        {
          "@type":
            "Country",
          name:
            "India",
        },
        {
          "@type":
            "AdministrativeArea",
          name:
            "Maharashtra",
        },
      ],

      sameAs: [
        "https://www.instagram.com/bucketlistadventuure/",
        "https://www.facebook.com/bucketlistadventures2018/",
        "https://maps.google.com/?cid=5483795621541448135",
      ],

      contactPoint: [
        {
          "@type":
            "ContactPoint",

          telephone:
            "+91-92255-31257",

          contactType:
            "customer service",

          areaServed:
            "IN",

          availableLanguage: [
            "English",
            "Hindi",
            "Marathi",
          ],
        },
      ],
    },

    {
      "@type":
        "WebSite",

      "@id":
        "https://bucketlistadventure.in/#website",

      url:
        "https://bucketlistadventure.in",

      name:
        "Bucketlist Adventure",

      publisher: {
        "@id":
          "https://bucketlistadventure.in/#organization",
      },

      inLanguage:
        "en-IN",
    },
  ],
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              JSON.stringify(
                structuredData
              ),
          }}
        />

        {children}
<WhatsAppWidget />
      </body>
    </html>
  );
}