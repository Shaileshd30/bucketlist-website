import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase-server";

import {
  defaultTrips,
  type TripBatch,
  type TripData,
} from "../../data/trips";

import { TripPageClient } from "./TripPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://bucketlistadventure.in";

type TripRow = {
  id: string;
  slug: string;
  title: string;

  trip_type: TripData["tripType"] | null;

  category: TripData["category"];

  highlight: string | null;
  subtitle: string | null;
  summary: string | null;
  cta: string | null;
  difficulty: string | null;
  start_point: string | null;
  duration_days: number | null;
  group_size: string | null;
  description: string | null;
  overview: string | null;
  image: string | null;
  gallery: string[] | null;

  itinerary: TripData["itinerary"] | null;

  includes: string[] | null;
  not_includes: string[] | null;
  pickup_points: string[] | null;
  things_to_carry: string[] | null;
  medical_disclaimer: string[] | null;
  rules: string[] | null;

  featured: boolean | null;
};

type BatchRow = {
  id: string;
  trip_id: string;
  departure_date: string;
  return_date: string;
  price: number | string;
  total_seats: number;
  booked_seats: number;
  payment_mode: TripBatch["paymentMode"];
  advance_amount: number | string;
  balance_due_date: string | null;
  status: TripBatch["status"];
  visibility: TripBatch["visibility"];
  booking_enabled: boolean;
};

function mapBatch(row: BatchRow): TripBatch {
  return {
    id: row.id,
    departureDate: row.departure_date,
    returnDate: row.return_date,
    price: Number(row.price),
    totalSeats: row.total_seats,
    bookedSeats: row.booked_seats,
    paymentMode: row.payment_mode,
    advanceAmount: Number(row.advance_amount),
    balanceDueDate: row.balance_due_date || undefined,
    status: row.status,
    visibility: row.visibility,
    bookingEnabled: row.booking_enabled,
  };
}

function mapTrip(
  row: TripRow,
  batches: TripBatch[]
): TripData {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,

    tripType: row.trip_type || undefined,

    category: row.category,

    highlight: row.highlight || undefined,
    subtitle: row.subtitle || "",
    summary: row.summary || "",

    cta: row.cta || "Book Now",

    difficulty: row.difficulty || "",
    startPoint: row.start_point || "",

    durationDays: row.duration_days || undefined,
    groupSize: row.group_size || undefined,

    description: row.description || undefined,
    overview: row.overview || undefined,

    image: row.image || "",
    gallery: row.gallery || [],

    itinerary: row.itinerary || [],

    includes: row.includes || [],
    notIncludes: row.not_includes || [],
    pickupPoints: row.pickup_points || [],
    thingsToCarry: row.things_to_carry || [],
    medicalDisclaimer: row.medical_disclaimer || [],
    rules: row.rules || [],

    featured: row.featured || false,

    batches,
  };
}

async function getTripBySlug(
  slug: string
): Promise<TripData | null> {
  try {
    const {
      data: tripData,
      error: tripError,
    } = await supabaseAdmin
      .from("trips")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (tripError) {
      console.error(
        "Trip lookup failed:",
        tripError
      );

      return null;
    }

    if (!tripData) {
      return null;
    }

    const {
      data: batchData,
      error: batchError,
    } = await supabaseAdmin
      .from("trip_batches")
      .select("*")
      .eq("trip_id", tripData.id)
      .order("departure_date", {
        ascending: true,
      });

    if (batchError) {
      console.error(
        "Trip batch lookup failed:",
        batchError
      );

      return null;
    }

    const batches = (
      (batchData || []) as BatchRow[]
    ).map(mapBatch);

    return mapTrip(
      tripData as TripRow,
      batches
    );
  } catch (error) {
    console.error(
      "getTripBySlug failed:",
      error
    );

    return null;
  }
}

/*
 * Use the Supabase trip first.
 * defaultTrips remains as a fallback for the
 * trips currently bundled with the website.
 */
async function resolveTrip(
  slug: string
): Promise<TripData | null> {
  const liveTrip =
    await getTripBySlug(slug);

  if (liveTrip) {
    return liveTrip;
  }

  return (
    defaultTrips.find(
      (item) => item.slug === slug
    ) || null
  );
}

function cleanDescription(
  trip: TripData
): string {
  const source =
    trip.summary ||
    trip.subtitle ||
    trip.overview ||
    trip.description ||
    `Explore ${trip.title} with Bucketlist Adventure.`;

  const cleaned = source
    .replace(/\s+/g, " ")
    .trim();

  /*
   * Keep search-result descriptions reasonably concise.
   */
  if (cleaned.length <= 155) {
    return cleaned;
  }

  return `${cleaned.slice(0, 152).trimEnd()}...`;
}

function getAbsoluteImageUrl(
  image?: string
): string | undefined {
  if (!image) {
    return undefined;
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `${BASE_URL}${
    image.startsWith("/") ? image : `/${image}`
  }`;
}

export async function generateMetadata({
  params,
}: {
  params:
    | Promise<{
        slug: string;
      }>
    | {
        slug: string;
      };
}): Promise<Metadata> {
  const { slug } =
    await Promise.resolve(params);

  const trip =
    await resolveTrip(slug);

  if (!trip) {
    return {
      title: "Trip Not Found",

      description:
        "The requested Bucketlist Adventure trip could not be found.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    cleanDescription(trip);

  const canonicalUrl =
    `${BASE_URL}/trips/${trip.slug}`;

  const imageUrl =
    getAbsoluteImageUrl(trip.image);

  /*
   * The root layout already uses:
   *
   * template: "%s | Bucketlist Adventure"
   *
   * so we only provide the trip-specific title here.
   */
  const seoTitle =
    trip.title;

  return {
    title: seoTitle,

    description,

    alternates: {
      canonical: canonicalUrl,
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

    openGraph: {
      title: `${trip.title} | Bucketlist Adventure`,

      description,

      url: canonicalUrl,

      siteName:
        "Bucketlist Adventure",

      type: "website",

      locale: "en_IN",

      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: `${trip.title} - Bucketlist Adventure`,
            },
          ]
        : undefined,
    },

    twitter: {
      card: "summary_large_image",

      title:
        `${trip.title} | Bucketlist Adventure`,

      description,

      images: imageUrl
        ? [imageUrl]
        : undefined,
    },
  };
}

export default async function TripPage({
  params,
}: {
  params:
    | Promise<{
        slug: string;
      }>
    | {
        slug: string;
      };
}) {
  const { slug } =
    await Promise.resolve(params);

  const trip =
    await resolveTrip(slug);

  /*
   * Important SEO improvement:
   *
   * Previously, an invalid slug displayed defaultTrips[0].
   * That could create many different URLs showing the same
   * trip, which is bad for indexing.
   *
   * Invalid trip URLs now return a proper 404.
   */
  if (!trip) {
    notFound();
  }

  return (
    <TripPageClient
      trip={trip}
    />
  );
}