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

/* =========================================================
   TYPES
========================================================= */

type TripRow = {
  id: string;
  slug: string;
  title: string;

  trip_type: TripData["tripType"] | null;

  category: TripData["category"];
  travel_category: TripData["travelCategory"] | null;
  destination: string | null;

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

/* =========================================================
   DATABASE MAPPERS
========================================================= */

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

    balanceDueDate:
      row.balance_due_date || undefined,

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

    tripType:
      row.trip_type || undefined,

    category: row.category,

    
travelCategory:
  row.travel_category || undefined,

destination:
  row.destination || undefined,

highlight:
  row.highlight || undefined,

    subtitle:
      row.subtitle || "",

    summary:
      row.summary || "",

    cta:
      row.cta || "Book Now",

    difficulty:
      row.difficulty || "",

    startPoint:
      row.start_point || "",

    durationDays:
      row.duration_days || undefined,

    groupSize:
      row.group_size || undefined,

    description:
      row.description || undefined,

    overview:
      row.overview || undefined,

    image:
      row.image || "",

    gallery:
      row.gallery || [],

    itinerary:
      row.itinerary || [],

    includes:
      row.includes || [],

    notIncludes:
      row.not_includes || [],

    pickupPoints:
      row.pickup_points || [],

    thingsToCarry:
      row.things_to_carry || [],

    medicalDisclaimer:
      row.medical_disclaimer || [],

    rules:
      row.rules || [],

    featured:
      row.featured || false,

    batches,
  };
}

/* =========================================================
   LOAD TRIP FROM SUPABASE
========================================================= */

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
.eq("archived", false)
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

/* =========================================================
   RESOLVE TRIP
   Supabase first, local fallback second
========================================================= */

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
      (item) =>
        item.slug === slug
    ) || null
  );
}

/* =========================================================
   SEO HELPERS
========================================================= */

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

  if (cleaned.length <= 155) {
    return cleaned;
  }

  return `${cleaned
    .slice(0, 152)
    .trimEnd()}...`;
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
    image.startsWith("/")
      ? image
      : `/${image}`
  }`;
}

/* =========================================================
   UPCOMING BATCH HELPERS
========================================================= */

function getActiveBatches(
  trip: TripData
): TripBatch[] {
  const now = new Date();

  now.setHours(
    0,
    0,
    0,
    0
  );

  return (trip.batches || [])
    .filter((batch) => {
      const departure =
        new Date(
          batch.departureDate
        );

      return departure >= now;
    })
    .sort(
      (a, b) =>
        new Date(
          a.departureDate
        ).getTime() -
        new Date(
          b.departureDate
        ).getTime()
    );
}

function getLowestPrice(
  batches: TripBatch[]
): number | undefined {
  const prices = batches
    .map((batch) =>
      Number(batch.price)
    )
    .filter(
      (price) =>
        Number.isFinite(price) &&
        price > 0
    );

  if (!prices.length) {
    return undefined;
  }

  return Math.min(
    ...prices
  );
}

function getDurationText(
  trip: TripData
): string | undefined {
  if (!trip.durationDays) {
    return undefined;
  }

  if (trip.durationDays === 1) {
    return "1 day";
  }

  return `${trip.durationDays} days`;
}

/* =========================================================
   STRUCTURED DATA
========================================================= */

function createTripStructuredData(
  trip: TripData
) {
  const canonicalUrl =
    `${BASE_URL}/trips/${trip.slug}`;

  const description =
    cleanDescription(trip);

  const imageUrl =
    getAbsoluteImageUrl(
      trip.image
    );

  const activeBatches =
    getActiveBatches(trip);

  const lowestPrice =
    getLowestPrice(
      activeBatches
    );

  const nextBatch =
    activeBatches[0];

  const seatsLeft =
    nextBatch
      ? Math.max(
          0,
          nextBatch.totalSeats -
            nextBatch.bookedSeats
        )
      : undefined;

  /* --------------------------
     TouristTrip
  -------------------------- */

  const tripSchema: Record<
    string,
    unknown
  > = {
    "@type": "TouristTrip",

    "@id":
      `${canonicalUrl}#trip`,

    name:
      trip.title,

    description,

    url:
      canonicalUrl,

    provider: {
      "@id":
        `${BASE_URL}/#organization`,
    },
  };

  /* Images */

  const images = [
    imageUrl,
    ...(trip.gallery || []).map(
      (image) =>
        getAbsoluteImageUrl(
          image
        )
    ),
  ].filter(
    (
      image
    ): image is string =>
      Boolean(image)
  );

  if (images.length > 0) {
    tripSchema.image =
      images;
  }

  /* Starting Point / Trip Category */

  /* Destination / Trip Category */

if (trip.travelCategory) {
  tripSchema.touristType =
    trip.travelCategory;
}

if (trip.destination || trip.startPoint) {
  tripSchema.itinerary = {
    "@type": "Place",

    name:
      trip.destination ||
      trip.startPoint,
  };
}

  /* Additional Properties */

  const additionalProperties: Array<
    Record<string, unknown>
  > = [];

  if (trip.difficulty) {
    additionalProperties.push({
      "@type":
        "PropertyValue",

      name:
        "Difficulty",

      value:
        trip.difficulty,
    });
  }

  const duration =
    getDurationText(trip);

  if (duration) {
    additionalProperties.push({
      "@type":
        "PropertyValue",

      name:
        "Duration",

      value:
        duration,
    });
  }

  if (trip.groupSize) {
    additionalProperties.push({
      "@type":
        "PropertyValue",

      name:
        "Group Size",

      value:
        trip.groupSize,
    });
  }

  if (
    additionalProperties.length >
    0
  ) {
    tripSchema.additionalProperty =
      additionalProperties;
  }

  /* Upcoming Departure */

  if (nextBatch) {
    tripSchema.startDate =
      nextBatch.departureDate;

    tripSchema.endDate =
      nextBatch.returnDate;
  }

  /* Price / Availability */

  if (
    lowestPrice !== undefined
  ) {
    tripSchema.offers = {
      "@type":
        "Offer",

      url:
        canonicalUrl,

      priceCurrency:
        "INR",

      price:
        lowestPrice,

      availability:
        seatsLeft !== undefined &&
        seatsLeft > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",

      seller: {
        "@id":
          `${BASE_URL}/#organization`,
      },
    };
  }

  /* --------------------------
     Breadcrumbs
  -------------------------- */

  const breadcrumbSchema = {
    "@type":
      "BreadcrumbList",

    "@id":
      `${canonicalUrl}#breadcrumb`,

    itemListElement: [
      {
        "@type":
          "ListItem",

        position:
          1,

        name:
          "Home",

        item:
          BASE_URL,
      },

      {
        "@type":
          "ListItem",

        position:
          2,

        name:
          "Trips",

        item:
          `${BASE_URL}/trips`,
      },

      {
        "@type":
          "ListItem",

        position:
          3,

        name:
          trip.title,

        item:
          canonicalUrl,
      },
    ],
  };

  return {
    "@context":
      "https://schema.org",

    "@graph": [
      tripSchema,
      breadcrumbSchema,
    ],
  };
}

/* =========================================================
   DYNAMIC SEO METADATA
========================================================= */

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
    await Promise.resolve(
      params
    );

  const trip =
    await resolveTrip(
      slug
    );

  if (!trip) {
    return {
      title:
        "Trip Not Found",

      description:
        "The requested Bucketlist Adventure trip could not be found.",

      robots: {
        index:
          false,

        follow:
          false,
      },
    };
  }

  const description =
    cleanDescription(
      trip
    );

  const canonicalUrl =
    `${BASE_URL}/trips/${trip.slug}`;

  const imageUrl =
    getAbsoluteImageUrl(
      trip.image
    );

  /*
   * Root layout already applies:
   * %s | Bucketlist Adventure
   */

  return {
    title:
      trip.title,

    description,

    alternates: {
      canonical:
        canonicalUrl,
    },

    robots: {
      index:
        true,

      follow:
        true,

      googleBot: {
        index:
          true,

        follow:
          true,

        "max-image-preview":
          "large",

        "max-snippet":
          -1,

        "max-video-preview":
          -1,
      },
    },

    openGraph: {
      title:
        `${trip.title} | Bucketlist Adventure`,

      description,

      url:
        canonicalUrl,

      siteName:
        "Bucketlist Adventure",

      type:
        "website",

      locale:
        "en_IN",

      images:
        imageUrl
          ? [
              {
                url:
                  imageUrl,

                alt:
                  `${trip.title} - Bucketlist Adventure`,
              },
            ]
          : undefined,
    },

    twitter: {
      card:
        "summary_large_image",

      title:
        `${trip.title} | Bucketlist Adventure`,

      description,

      images:
        imageUrl
          ? [
              imageUrl,
            ]
          : undefined,
    },
  };
}

/* =========================================================
   PAGE
========================================================= */

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
    await Promise.resolve(
      params
    );

  const trip =
    await resolveTrip(
      slug
    );

  /*
   * Proper 404 for invalid trip URLs.
   */

  if (!trip) {
    notFound();
  }

  const structuredData =
    createTripStructuredData(
      trip
    );

  return (
    <>
      {/* TRIP + BREADCRUMB STRUCTURED DATA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              structuredData
            ),
        }}
      />

      <TripPageClient
        trip={trip}
      />
    </>
  );
}