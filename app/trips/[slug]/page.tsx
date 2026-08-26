import type { Metadata } from "next";

import { supabaseAdmin } from "@/lib/supabase-server";

import {
  defaultTrips,
  type TripBatch,
  type TripData,
} from "../../data/trips";

import { TripPageClient } from "./TripPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TripRow = {
  id: string;
  slug: string;
  title: string;

  trip_type:
    | TripData["tripType"]
    | null;

  category:
    TripData["category"];

  highlight:
    string | null;

  subtitle:
    string | null;

  summary:
    string | null;

  cta:
    string | null;

  difficulty:
    string | null;

  start_point:
    string | null;

  duration_days:
    number | null;

  group_size:
    string | null;

  description:
    string | null;

  overview:
    string | null;

  image:
    string | null;

  gallery:
    string[] | null;

  itinerary:
    TripData["itinerary"] | null;

  includes:
    string[] | null;

  not_includes:
    string[] | null;

  pickup_points:
    string[] | null;

  things_to_carry:
    string[] | null;

  medical_disclaimer:
    string[] | null;

  rules:
    string[] | null;

  featured:
    boolean | null;
};

type BatchRow = {
  id: string;

  trip_id: string;

  departure_date:
    string;

  return_date:
    string;

  price:
    number | string;

  total_seats:
    number;

  booked_seats:
    number;

  payment_mode:
    TripBatch["paymentMode"];

  advance_amount:
    number | string;

  balance_due_date:
    string | null;

  status:
    TripBatch["status"];

  visibility:
    TripBatch["visibility"];

  booking_enabled:
    boolean;
};

function mapBatch(
  row: BatchRow
): TripBatch {
  return {
    id: row.id,

    departureDate:
      row.departure_date,

    returnDate:
      row.return_date,

    price:
      Number(row.price),

    totalSeats:
      row.total_seats,

    bookedSeats:
      row.booked_seats,

    paymentMode:
      row.payment_mode,

    advanceAmount:
      Number(
        row.advance_amount
      ),

    balanceDueDate:
      row.balance_due_date ||
      undefined,

    status:
      row.status,

    visibility:
      row.visibility,

    bookingEnabled:
      row.booking_enabled,
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
      row.trip_type ||
      undefined,

    category:
      row.category,

    highlight:
      row.highlight ||
      undefined,

    subtitle:
      row.subtitle || "",

    summary:
      row.summary || "",

    cta:
      row.cta ||
      "Book Now",

    difficulty:
      row.difficulty || "",

    startPoint:
      row.start_point || "",

    durationDays:
      row.duration_days ||
      undefined,

    groupSize:
      row.group_size ||
      undefined,

    description:
      row.description ||
      undefined,

    overview:
      row.overview ||
      undefined,

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
      row.things_to_carry ||
      [],

    medicalDisclaimer:
      row.medical_disclaimer ||
      [],

    rules:
      row.rules || [],

    featured:
      row.featured ||
      false,

    batches,
  };
}

async function getTripBySlug(
  slug: string
): Promise<TripData | null> {
  try {
    /*
     * Load the trip directly
     * from Supabase.
     */
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

    /*
     * Load this trip's departures.
     */
    const {
      data: batchData,
      error: batchError,
    } = await supabaseAdmin
      .from("trip_batches")
      .select("*")
      .eq(
        "trip_id",
        tripData.id
      )
      .order(
        "departure_date",
        {
          ascending: true,
        }
      );

    if (batchError) {
      console.error(
        "Trip batch lookup failed:",
        batchError
      );

      return null;
    }

    const batches =
      (
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
    await getTripBySlug(
      slug
    );

  const metadataTrip =
    trip ||
    defaultTrips.find(
      (item) =>
        item.slug === slug
    ) ||
    defaultTrips[0];

  return {
    title:
      `${metadataTrip.title} | Bucketlist Adventure`,

    description:
      metadataTrip.summary,

    alternates: {
      canonical:
        `/trips/${metadataTrip.slug}`,
    },

    openGraph: {
      title:
        metadataTrip.title,

      description:
        metadataTrip.summary,

      url:
        `/trips/${metadataTrip.slug}`,

      images:
        metadataTrip.image
          ? [
              {
                url:
                  metadataTrip.image,

                alt:
                  metadataTrip.title,
              },
            ]
          : [],

      type:
        "article",
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
    await Promise.resolve(
      params
    );

  const trip =
    await getTripBySlug(
      slug
    );

  /*
   * Keep the existing fallback for now.
   * We can change this to notFound()
   * later if desired.
   */
  if (!trip) {
    const fallback =
      defaultTrips.find(
        (item) =>
          item.slug === slug
      ) ||
      defaultTrips[0];

    return (
      <TripPageClient
        trip={fallback}
      />
    );
  }

  return (
    <TripPageClient
      trip={trip}
    />
  );
}