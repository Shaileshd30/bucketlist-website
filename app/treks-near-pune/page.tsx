import type { Metadata } from "next";
import Link from "next/link";

import { supabaseAdmin } from "@/lib/supabase-server";

import {
  defaultTrips,
  type TripBatch,
  type TripData,
} from "../data/trips";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://bucketlistadventure.in";
const PAGE_URL = `${BASE_URL}/treks-near-pune`;

/* =========================================================
   SEO
========================================================= */

export const metadata: Metadata = {
  title: "Treks Near Pune & Weekend Treks from Pune",

  description:
    "Discover treks near Pune, one-day treks, weekend treks, monsoon adventures, forts and Sahyadri experiences with Bucketlist Adventure. Explore upcoming departures, prices and trip details.",

  alternates: {
    canonical: PAGE_URL,
  },

  openGraph: {
    title:
      "Treks Near Pune & Weekend Treks from Pune | Bucketlist Adventure",

    description:
      "Explore upcoming treks near Pune, Sahyadri adventures, one-day treks and weekend trekking experiences with Bucketlist Adventure.",

    url: PAGE_URL,

    siteName: "Bucketlist Adventure",

    locale: "en_IN",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Treks Near Pune & Weekend Treks from Pune | Bucketlist Adventure",

    description:
      "Upcoming Pune and Sahyadri treks, weekend adventures and one-day trekking experiences.",
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
   LOAD TRIPS
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
          "Treks near Pune trip lookup failed:",
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
        "Treks near Pune batch lookup failed:",
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
      "Treks near Pune data load failed:",
      error
    );

    return defaultTrips;
  }
}

/* =========================================================
   PUNE / SAHYADRI FILTER
========================================================= */

function isPuneTrek(
  trip: TripData
): boolean {
  const searchable = [
    trip.title,
    String(trip.category || ""),
    trip.startPoint,
    trip.subtitle,
    trip.summary,
    trip.highlight,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const positiveSignals = [
    "pune",
    "sahyadri",
    "weekend trek",
    "weekend",
    "fort",
    "waterfall",
    "maharashtra",
    "maval",
    "tamhini",
    "lonavala",
    "kamshet",
    "mulshi",
  ];

  const obviousLongHaulSignals = [
    "ladakh",
    "spiti",
    "kashmir",
    "nepal",
    "himalaya",
    "himachal",
    "uttarakhand",
    "srinagar",
    "leh",
  ];

  const hasPositiveSignal =
    positiveSignals.some((signal) =>
      searchable.includes(signal)
    );

  const hasLongHaulSignal =
    obviousLongHaulSignals.some(
      (signal) =>
        searchable.includes(signal)
    );

  return (
    hasPositiveSignal &&
    !hasLongHaulSignal
  );
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

  const available =
    [...trip.batches]
      .filter((batch) => {
        const departure =
          new Date(
            batch.departureDate
          );

        const seatsLeft =
          batch.totalSeats -
          (batch.bookedSeats || 0);

        return (
          batch.visibility ===
            "PUBLIC" &&
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

  return available[0] ?? null;
}

function formatDate(
  date: string
): string {
  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return parsed.toLocaleDateString(
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
): string {
  return `₹${price.toLocaleString(
    "en-IN"
  )}`;
}

function getDuration(
  trip: TripData
): string {
  if (trip.duration) {
    return trip.duration;
  }

  if (trip.durationDays) {
    return `${trip.durationDays} ${
      trip.durationDays === 1
        ? "Day"
        : "Days"
    }`;
  }

  return "Flexible";
}

/* =========================================================
   FAQ
========================================================= */

const faqs = [
  {
    question:
      "Which are the best treks near Pune?",
    answer:
      "The best trek depends on the season, difficulty level and experience you are looking for. Pune is surrounded by Sahyadri forts, forest trails, waterfalls and monsoon trekking routes, making it possible to choose anything from an easy one-day outing to a more demanding weekend trek.",
  },

  {
    question:
      "Are there one-day treks from Pune?",
    answer:
      "Yes. Many Sahyadri trekking routes can be completed as one-day trips from Pune, with early-morning departure and return by evening. Upcoming one-day departures are displayed on this page whenever available.",
  },

  {
    question:
      "Are treks near Pune suitable for beginners?",
    answer:
      "Several treks around Pune are suitable for beginners, while others involve steep climbs, slippery monsoon terrain or longer walking distances. Always check the difficulty level and itinerary of the specific trek before booking.",
  },

  {
    question:
      "What is the best season for trekking near Pune?",
    answer:
      "Monsoon is particularly popular for waterfalls, forests and green Sahyadri landscapes. Post-monsoon and winter are excellent for forts, clear views and comfortable trekking conditions. Some routes may be seasonal depending on weather and local conditions.",
  },

  {
    question:
      "What should I carry for a trek near Pune?",
    answer:
      "Comfortable trekking shoes, sufficient water, weather-appropriate clothing, personal medication and a small backpack are usually recommended. Each Bucketlist Adventure trip page includes a specific Things to Carry section for that trek.",
  },

  {
    question:
      "Do Bucketlist Adventure treks include transport from Pune?",
    answer:
      "Transport and pickup arrangements depend on the individual trek. Check the trip inclusions and pickup points on the specific adventure page before booking.",
  },
];

/* =========================================================
   STRUCTURED DATA
========================================================= */

function createStructuredData(
  trips: TripData[]
) {
  return {
    "@context":
      "https://schema.org",

    "@graph": [
      {
        "@type":
          "BreadcrumbList",

        "@id":
          `${PAGE_URL}#breadcrumb`,

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
              "Treks Near Pune",

            item:
              PAGE_URL,
          },
        ],
      },

      {
        "@type":
          "ItemList",

        "@id":
          `${PAGE_URL}#treks`,

        name:
          "Treks Near Pune",

        numberOfItems:
          trips.length,

        itemListElement:
          trips.map(
            (trip, index) => ({
              "@type":
                "ListItem",

              position:
                index + 1,

              name:
                trip.title,

              url:
                `${BASE_URL}/trips/${trip.slug}`,
            })
          ),
      },

      {
        "@type":
          "FAQPage",

        "@id":
          `${PAGE_URL}#faq`,

        mainEntity:
          faqs.map((faq) => ({
            "@type":
              "Question",

            name:
              faq.question,

            acceptedAnswer: {
              "@type":
                "Answer",

              text:
                faq.answer,
            },
          })),
      },
    ],
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function TreksNearPunePage() {
  const allTrips =
    await getTrips();

  let puneTrips =
    allTrips.filter(
      isPuneTrek
    );

  /*
   * Fallback:
   * If no Pune/Sahyadri signal is found,
   * do not leave the landing page empty.
   */
  if (puneTrips.length === 0) {
    puneTrips =
      allTrips.filter(
        (trip) =>
          trip.durationDays === 1 ||
          trip.durationDays === 2
      );
  }

  const structuredData =
    createStructuredData(
      puneTrips
    );

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">

      {/* STRUCTURED DATA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              structuredData
            ),
        }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#17251d] px-6 py-20 text-white sm:py-24 lg:px-10 lg:py-28">

        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border border-white/5" />

        <div className="absolute -right-12 -top-12 h-[260px] w-[260px] rounded-full border border-white/5" />

        <div className="relative mx-auto max-w-6xl">

          <Link
            href="/"
            className="inline-flex text-sm font-semibold text-orange-300 transition hover:text-white"
          >
            ← Back to Bucketlist Adventure
          </Link>

          <p className="mt-12 text-xs font-bold uppercase tracking-[0.3em] text-orange-300">
            Pune • Sahyadri • Weekend Adventures
          </p>

          <h1 className="mt-5 max-w-5xl text-4xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-5xl lg:text-7xl">
            Treks near Pune
            <span className="block text-white/40">
              & weekend treks from Pune.
            </span>
          </h1>

          <p className="mt-7 max-w-3xl text-base leading-8 text-white/65 sm:text-lg">
            Escape the city and explore
            Sahyadri forts, monsoon trails,
            waterfalls, forests and mountain
            routes with thoughtfully planned
            trekking experiences from Pune.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">

            <a
              href="#upcoming-treks"
              className="inline-flex rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-400"
            >
              Explore Upcoming Treks ↓
            </a>

            <a
              href="https://wa.me/918482846287?text=Hi%20Bucketlist%20Adventure%2C%20I%20am%20looking%20for%20a%20trek%20near%20Pune."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#17251d]"
            >
              Ask on WhatsApp ↗
            </a>

          </div>

          {/* QUICK TRUST */}
          <div className="mt-14 grid grid-cols-2 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] sm:grid-cols-4">

            {[
              [
                "Travellers",
                "10,000+",
              ],
              [
                "Base",
                "Pune",
              ],
              [
                "Approach",
                "Safety First",
              ],
              [
                "Experiences",
                "Treks & Beyond",
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  className="border-b border-r border-white/10 p-5 last:border-r-0 sm:border-b-0"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/40">
                    {label}
                  </p>

                  <p className="mt-2 text-lg font-bold">
                    {value}
                  </p>
                </div>
              )
            )}

          </div>

        </div>

      </section>

      {/* INTRO */}
      <section className="px-6 py-16 sm:py-20 lg:px-10">

        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              Adventure close to home
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              The Sahyadris make
              weekends better.
            </h2>
          </div>

          <div className="space-y-5 text-[15px] leading-8 text-[#5d6862] sm:text-base">

            <p>
              Pune is surrounded by some of
              Maharashtra&apos;s most memorable
              trekking terrain — historic forts,
              forest trails, high plateaus,
              waterfalls and dramatic monsoon
              landscapes.
            </p>

            <p>
              Whether you&apos;re planning your
              first trek or looking for your next
              weekend challenge, Bucketlist
              Adventure helps take care of the
              route planning, coordination,
              transport and on-ground experience
              so you can focus on the journey.
            </p>

            <p>
              Browse the available treks below
              for upcoming departure dates,
              difficulty, duration, pricing,
              inclusions and booking information.
            </p>

          </div>

        </div>

      </section>

      {/* UPCOMING TREKS */}
      <section
        id="upcoming-treks"
        className="scroll-mt-10 px-6 pb-20 lg:px-10"
      >

        <div className="mx-auto max-w-6xl">

          <div className="mb-9 flex flex-col gap-5 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                Upcoming adventures
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Treks from Pune
              </h2>
            </div>

            <p className="text-sm text-[#5d6862]">
              {puneTrips.length}{" "}
              {puneTrips.length === 1
                ? "adventure"
                : "adventures"}
            </p>

          </div>

          {puneTrips.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {puneTrips.map(
                (trip) => {
                  const nextBatch =
                    getNextBatch(
                      trip
                    );

                  const duration =
                    getDuration(
                      trip
                    );

                  const displayPrice =
                    nextBatch
                      ? formatPrice(
                          nextBatch.price
                        )
                      : trip.price ||
                        "On request";

                  const seatsLeft =
                    nextBatch
                      ? Math.max(
                          0,
                          nextBatch.totalSeats -
                            (nextBatch.bookedSeats ||
                              0)
                        )
                      : null;

                  return (
                    <Link
                      key={
                        trip.slug
                      }
                      href={`/trips/${trip.slug}`}
                      className="group overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_22px_55px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.1)]"
                    >

                      <div
                        role="img"
                        aria-label={`${trip.title} trek near Pune`}
                        className="relative h-60 bg-[#d8ddd8] bg-cover bg-center"
                        style={{
                          backgroundImage:
                            trip.image
                              ? `url('${trip.image}')`
                              : undefined,
                        }}
                      >

                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                        {trip.difficulty && (
                          <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                            {
                              trip.difficulty
                            }
                          </span>
                        )}

                      </div>

                      <div className="p-6">

                        <div className="flex items-center justify-between gap-4">

                          <span className="text-[10px] font-bold uppercase tracking-[0.19em] text-orange-500">
                            {trip.startPoint ||
                              "From Pune"}
                          </span>

                          <span className="text-xs font-semibold text-[#17251d]/55">
                            {duration}
                          </span>

                        </div>

                        <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#17251d]">
                          {trip.title}
                        </h3>

                        {trip.summary && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5d6862]">
                            {
                              trip.summary
                            }
                          </p>
                        )}

                        {nextBatch && (
                          <div className="mt-5 grid grid-cols-2 gap-3">

                            <div className="rounded-2xl bg-[#f7f5f2] p-3">
                              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#17251d]/45">
                                Next trip
                              </p>

                              <p className="mt-1 text-sm font-semibold">
                                {formatDate(
                                  nextBatch.departureDate
                                )}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-[#f7f5f2] p-3">
                              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#17251d]/45">
                                Seats
                              </p>

                              <p className="mt-1 text-sm font-semibold">
                                {seatsLeft}{" "}
                                available
                              </p>
                            </div>

                          </div>
                        )}

                        <div className="mt-6 flex items-end justify-between gap-4 border-t border-black/10 pt-5">

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#17251d]/45">
                              From
                            </p>

                            <p className="mt-1 text-lg font-bold">
                              {
                                displayPrice
                              }
                            </p>
                          </div>

                          <span className="rounded-full bg-[#17251d] px-4 py-2.5 text-xs font-bold text-white transition group-hover:bg-orange-500">
                            View Trek ↗
                          </span>

                        </div>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>
          ) : (
            <div className="rounded-[28px] border border-black/10 bg-white p-8">

              <h3 className="text-2xl font-bold">
                New Pune departures
                coming soon.
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-7 text-[#5d6862]">
                Contact our team and we&apos;ll
                share the next available
                Sahyadri and weekend trekking
                departures.
              </p>

            </div>
          )}

        </div>

      </section>

      {/* CHOOSE YOUR TREK */}
      <section className="bg-white px-6 py-20 lg:px-10">

        <div className="mx-auto max-w-6xl">

          <div className="max-w-3xl">

            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              Choosing your trek
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Start with the experience
              you want.
            </h2>

            <p className="mt-5 text-base leading-8 text-[#5d6862]">
              Trek difficulty is only one part
              of choosing the right adventure.
              Consider the season, trail
              duration, terrain, travel time and
              the kind of experience you want
              from your weekend.
            </p>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">

            <InfoCard
              number="01"
              title="First-time trekkers"
              text="Start with an easier route, manageable walking distance and a well-supported group experience."
            />

            <InfoCard
              number="02"
              title="Monsoon explorers"
              text="Choose forest trails, plateaus and waterfall routes when the Sahyadris turn green during the rains."
            />

            <InfoCard
              number="03"
              title="Fort & mountain lovers"
              text="Explore historic Sahyadri forts, ridges and longer trails when you want more elevation and challenge."
            />

          </div>

        </div>

      </section>

      {/* ONE DAY VS WEEKEND */}
      <section className="px-6 py-20 lg:px-10">

        <div className="mx-auto max-w-6xl">

          <div className="grid overflow-hidden rounded-[32px] border border-black/10 bg-white lg:grid-cols-2">

            <div className="p-8 sm:p-10 lg:p-12">

              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                One-day treks
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Maximum adventure.
                Minimum leave.
              </h2>

              <p className="mt-5 text-sm leading-7 text-[#5d6862]">
                One-day treks are ideal when
                you want a quick escape from
                Pune without planning an entire
                weekend away. Many routes
                combine early departure,
                trekking, meals and return
                travel within the same day.
              </p>

            </div>

            <div className="bg-[#17251d] p-8 text-white sm:p-10 lg:p-12">

              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                Weekend treks
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                More trail.
                More time outside.
              </h2>

              <p className="mt-5 text-sm leading-7 text-white/65">
                Weekend adventures allow more
                time for longer trails, sunrise
                experiences, camping, forts and
                destinations that need a little
                more travel from Pune.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* FAQ */}
      <section className="px-6 pb-20 lg:px-10">

        <div className="mx-auto max-w-6xl">

          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                Trekking from Pune
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently asked
                questions.
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#5d6862]">
                A few useful things to know
                before choosing your next Pune
                or Sahyadri trek.
              </p>
            </div>

            <div className="space-y-3">

              {faqs.map(
                (faq, index) => (
                  <details
                    key={
                      faq.question
                    }
                    className="group rounded-[22px] border border-black/10 bg-white px-5 py-5"
                  >

                    <summary className="flex cursor-pointer list-none items-start justify-between gap-5 font-semibold">

                      <span>
                        {
                          faq.question
                        }
                      </span>

                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5f3ee] text-lg transition group-open:rotate-45">
                        +
                      </span>

                    </summary>

                    <p className="mt-4 border-t border-black/10 pt-4 text-sm leading-7 text-[#5d6862]">
                      {faq.answer}
                    </p>

                  </details>
                )
              )}

            </div>

          </div>

        </div>

      </section>

      {/* FINAL CTA */}
      <section className="px-6 pb-20 lg:px-10">

        <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#17251d] p-8 text-white sm:p-10 lg:p-14">

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                Your weekend starts here
              </p>

              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Find a trail.
                <span className="block text-white/35">
                  Make it a story.
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">
                Not sure which trek is right
                for you? Tell us your preferred
                date, experience level and
                group size and we&apos;ll help
                you choose.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">

              <a
                href="https://wa.me/918482846287?text=Hi%20Bucketlist%20Adventure%2C%20please%20suggest%20a%20trek%20near%20Pune."
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-400"
              >
                Get Trek Suggestions ↗
              </a>

              <Link
                href="/trips"
                className="rounded-full border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold transition hover:bg-white hover:text-[#17251d]"
              >
                View All Trips
              </Link>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[26px] border border-black/10 bg-[#f5f3ee] p-7">

      <span className="text-xs font-bold tracking-[0.2em] text-orange-500">
        {number}
      </span>

      <h3 className="mt-6 text-xl font-bold tracking-tight">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[#5d6862]">
        {text}
      </p>

    </article>
  );
}