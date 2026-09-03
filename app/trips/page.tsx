import type { Metadata } from "next";
import Link from "next/link";

import { supabaseAdmin } from "@/lib/supabase-server";

import {
  defaultTrips,
  travelCategories,
  type TripBatch,
  type TripData,
} from "../data/trips";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://bucketlistadventure.in";

/* =========================================================
   SEO METADATA
========================================================= */

export const metadata: Metadata = {
  title: "Treks, Domestic Tours & International Trips",

  description:
    "Explore treks and adventures, domestic tours across India, and international trips with Bucketlist Adventure. Discover upcoming departures, road trips, holidays and customized journeys.",

  alternates: {
    canonical: `${BASE_URL}/trips`,
  },

  openGraph: {
    title:
      "Treks, Domestic Tours & International Trips | Bucketlist Adventure",

    description:
      "Discover treks and adventures, domestic tours across India, international trips and thoughtfully planned journeys with Bucketlist Adventure.",

    url: `${BASE_URL}/trips`,

    siteName: "Bucketlist Adventure",

    type: "website",

    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Adventure Trips, Treks & Expeditions | Bucketlist Adventure",

    description:
      "Weekend treks, Himalayan expeditions, road trips and adventure journeys across India and beyond.",
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
};

/* =========================================================
   DATABASE TYPES
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
   DATABASE MAPPING
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
   LOAD ALL TRIPS
========================================================= */

async function getTrips(): Promise<TripData[]> {
  try {
    const {
      data: tripData,
      error: tripError,
    } = await supabaseAdmin
      .from("trips")
      .select("*")
      .eq("archived", false)
      .order("title", {
        ascending: true,
      });

    if (
      tripError ||
      !tripData ||
      tripData.length === 0
    ) {
      if (tripError) {
        console.error(
          "Trips lookup failed:",
          tripError
        );
      }

      return defaultTrips;
    }

    const {
      data: batchData,
      error: batchError,
    } = await supabaseAdmin
      .from("trip_batches")
      .select("*")
      .order("departure_date", {
        ascending: true,
      });

    if (batchError) {
      console.error(
        "Trip batch lookup failed:",
        batchError
      );

      return defaultTrips;
    }

    const batches =
      (batchData || []) as BatchRow[];

    return (tripData as TripRow[]).map(
      (trip) => {
        const tripBatches = batches
          .filter(
            (batch) =>
              batch.trip_id === trip.id
          )
          .map(mapBatch);

        return mapTrip(
          trip,
          tripBatches
        );
      }
    );
  } catch (error) {
    console.error(
      "getTrips failed:",
      error
    );

    return defaultTrips;
  }
}

/* =========================================================
   HELPERS
========================================================= */

function getNextBatch(
  trip: TripData
): TripBatch | null {
  if (
    !trip.batches ||
    trip.batches.length === 0
  ) {
    return null;
  }

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const availableBatches =
    trip.batches
      .filter((batch) => {
        const departure =
          new Date(
            batch.departureDate
          );

        const seatsLeft =
          batch.totalSeats -
          (batch.bookedSeats || 0);

        return (
          batch.visibility === "PUBLIC" &&
          batch.status === "OPEN" &&
          batch.bookingEnabled &&
          seatsLeft > 0 &&
          departure >= today
        );
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

  return availableBatches[0] ?? null;
}

function formatDate(
  date: string
) {
  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatPrice(
  price: number
) {
  return `₹${price.toLocaleString(
    "en-IN"
  )}`;
}

/* =========================================================
   STRUCTURED DATA
========================================================= */

function createStructuredData(
  trips: TripData[]
) {
  const breadcrumbSchema = {
    "@type":
      "BreadcrumbList",

    "@id":
      `${BASE_URL}/trips#breadcrumb`,

    itemListElement: [
      {
        "@type":
          "ListItem",

        position: 1,

        name: "Home",

        item: BASE_URL,
      },

      {
        "@type":
          "ListItem",

        position: 2,

        name:
          "Adventure Trips",

        item:
          `${BASE_URL}/trips`,
      },
    ],
  };

  const itemListSchema = {
    "@type":
      "ItemList",

    "@id":
      `${BASE_URL}/trips#trips`,

    name:
      "Bucketlist Adventure Trips",

    description:
      "Treks, expeditions, road trips and adventure journeys by Bucketlist Adventure.",

    numberOfItems:
      trips.length,

    itemListElement:
      trips.map(
        (trip, index) => ({
          "@type":
            "ListItem",

          position:
            index + 1,

          url:
            `${BASE_URL}/trips/${trip.slug}`,

          name:
            trip.title,
        })
      ),
  };

  return {
    "@context":
      "https://schema.org",

    "@graph": [
      breadcrumbSchema,
      itemListSchema,
    ],
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const trips =
    await getTrips();

  const params = await searchParams;

  const requestedCategory =
    typeof params.category === "string"
      ? decodeURIComponent(params.category)
      : "";

  const activeCategory =
    travelCategories.includes(
      requestedCategory as (typeof travelCategories)[number]
    )
      ? (requestedCategory as (typeof travelCategories)[number])
      : null;

  const groupedTrips =
    travelCategories.reduce(
      (acc, category) => {
        acc[category] =
          trips.filter(
            (trip) =>
              trip.travelCategory ===
              category
          );

        return acc;
      },
      {} as Record<
        string,
        TripData[]
      >
    );

  const visibleCategories =
    activeCategory
      ? travelCategories.filter(
          (category) => category === activeCategory
        )
      : travelCategories;

  const visibleTrips =
    activeCategory
      ? trips.filter(
          (trip) =>
            trip.travelCategory === activeCategory
        )
      : trips;

  const structuredData =
    createStructuredData(
      visibleTrips
    );

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">

      {/* SEO STRUCTURED DATA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              structuredData
            ),
        }}
      />

      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">

        {/* BACK */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
        >
          ← Back to home
        </Link>

        {/* PAGE HEADING */}
        <header className="mb-14">

          <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
            Bucketlist Adventure
          </p>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Adventures, holidays &
            journeys worth living
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-[#5d6862] sm:text-lg">
            Explore treks and expeditions, unforgettable
            journeys across India, and thoughtfully planned
            international experiences — all curated by
            Bucketlist Adventure.
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#6b756f]">
            Whether you&apos;re looking for a weekend
            trek, a Ladakh or Spiti road trip, a Kerala
            escape, an Andaman holiday, or your next
            international journey, start with the collection
            that fits the way you want to travel.
          </p>

          {activeCategory && (
            <p className="mt-5 inline-flex rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">
              Showing only: {activeCategory}
            </p>
          )}

        </header>
        <div className="mb-12 overflow-hidden rounded-[28px] border border-black/10 bg-white p-6 sm:p-8">
  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
        Trekking from Pune
      </p>

      <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        Looking for treks near Pune?
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d6862]">
        Explore Sahyadri forts, one-day treks, monsoon trails,
        waterfalls and upcoming weekend treks from Pune.
      </p>
    </div>

    <Link
      href="/treks-near-pune"
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#17251d] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-500"
    >
      Explore Pune Treks ↗
    </Link>
  </div>
</div>

        {/* QUICK DISCOVERY / FILTERS */}
        <div className="mb-14 flex flex-wrap gap-3">

          <Link
            href="/trips"
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              !activeCategory
                ? "border-[#17251d] bg-[#17251d] text-white"
                : "border-black/10 bg-white text-[#17251d] hover:border-orange-400 hover:text-orange-500"
            }`}
          >
            All Trips
            <span className={`ml-2 ${!activeCategory ? "text-white/60" : "text-[#17251d]/40"}`}>
              {trips.length}
            </span>
          </Link>

          {travelCategories.map(
            (category) => {
              const count =
                groupedTrips[
                  category
                ]?.length || 0;

              if (count === 0) {
                return null;
              }

              const isActive =
                activeCategory === category;

              return (
                <Link
                  key={category}
                  href={`/trips?category=${encodeURIComponent(category)}`}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-[#17251d] bg-[#17251d] text-white"
                      : "border-black/10 bg-white text-[#17251d] hover:border-orange-400 hover:text-orange-500"
                  }`}
                >
                  {category}
                  <span className={`ml-2 ${isActive ? "text-white/60" : "text-[#17251d]/40"}`}>
                    {count}
                  </span>
                </Link>
              );
            }
          )}

        </div>

        {/* CATEGORIES */}
        <div className="space-y-16">

          {visibleCategories.map(
            (category) => {
              const categoryTrips =
                groupedTrips[
                  category
                ] ?? [];

              if (
                categoryTrips.length ===
                0
              ) {
                return null;
              }

              const sectionId =
                category
                  .toLowerCase()
                  .replace(
                    /[^a-z0-9]+/g,
                    "-"
                  );

              return (
                <section
                  key={category}
                  id={sectionId}
                  className="scroll-mt-24 space-y-6"
                >

                  {/* CATEGORY HEADING */}
                  <div className="flex items-end justify-between gap-4 border-b border-black/10 pb-4">

                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                        Explore
                      </p>

                      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        {category}
                      </h2>
                    </div>

                    <span className="text-sm font-medium text-[#17251d]/70">
                      {
                        categoryTrips.length
                      }{" "}
                      {categoryTrips.length ===
                      1
                        ? "trip"
                        : "trips"}
                    </span>

                  </div>

                  {/* TRIP CARDS */}
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

                    {categoryTrips.map(
                      (trip) => {
                        const nextBatch =
                          getNextBatch(
                            trip
                          );

                        const displayPrice =
                          nextBatch
                            ? formatPrice(
                                nextBatch.price
                              )
                            : trip.price ??
                              "Price on request";

                        const displayDuration =
                          trip.duration ??
                          (trip.durationDays
                            ? `${
                                trip.durationDays
                              } ${
                                trip.durationDays ===
                                1
                                  ? "Day"
                                  : "Days"
                              }`
                            : "Flexible");

                        return (
                          <Link
                            key={
                              trip.slug
                            }
                            href={`/trips/${trip.slug}`}
                            className="group overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.12)]"
                          >

                            {/* IMAGE */}
                            <div
                              role="img"
                              aria-label={`${trip.title} adventure`}
                              className="h-56 bg-cover bg-center"
                              style={{
                                backgroundImage:
                                  `url('${trip.image}')`,
                              }}
                            />

                            <div className="p-6">

                              {/* LOCATION + DURATION */}
                              <div className="mb-4 flex items-center justify-between gap-4">

                                <span className="rounded-full bg-[#f7f5f2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]">
                                  {trip.destination ||
                                    trip.startPoint ||
                                    "Explore"}
                                </span>

                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-orange-500">
                                  {
                                    displayDuration
                                  }
                                </span>

                              </div>

                              {/* TITLE */}
                              <h3 className="text-2xl font-bold text-[#17251d]">
                                {
                                  trip.title
                                }
                              </h3>

                              {/* SUMMARY */}
                              {trip.summary && (
                                <p className="mt-3 text-sm leading-6 text-[#5d6862]">
                                  {
                                    trip.summary
                                  }
                                </p>
                              )}

                              {/* NEXT DEPARTURE */}
                              {nextBatch && (
                                <div className="mt-5 rounded-2xl bg-[#f7f5f2] px-4 py-3">

                                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                                    Next departure
                                  </p>

                                  <p className="mt-1 text-sm font-semibold text-[#17251d]">
                                    {formatDate(
                                      nextBatch.departureDate
                                    )}
                                  </p>

                                </div>
                              )}

                              {/* PRICE + CTA */}
                              <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/10 pt-4">

                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                                    From
                                  </p>

                                  <p className="mt-1 font-semibold text-[#17251d]">
                                    {
                                      displayPrice
                                    }
                                  </p>
                                </div>

                                <span className="inline-flex items-center gap-2 rounded-full bg-[#17251d] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition group-hover:bg-orange-500">
                                  View trip
                                  <span
                                    aria-hidden="true"
                                  >
                                    ↗
                                  </span>
                                </span>

                              </div>

                            </div>

                          </Link>
                        );
                      }
                    )}

                  </div>

                </section>
              );
            }
          )}

        </div>

        {/* SEO / INTERNAL LINKING FOOTER */}
        <section className="mt-20 overflow-hidden rounded-[32px] bg-[#17251d] p-8 text-white sm:p-10 lg:p-12">

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                Can&apos;t find your trip?
              </p>

              <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Tell us where you want
                to go.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                Bucketlist Adventure also
                plans customized holidays,
                private group journeys,
                corporate outings and
                adventure experiences across
                India and beyond.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">

              <Link
                href="/contact"
                className="inline-flex rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-400"
              >
                Plan a Custom Trip ↗
              </Link>

              <a
                href="https://wa.me/919225531257?text=Hi%20Bucketlist%20Adventure%2C%20I%20would%20like%20to%20plan%20a%20trip."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#17251d]"
              >
                WhatsApp Us
              </a>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}