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
const PAGE_URL = `${BASE_URL}/himalayan-treks-india`;

/* =========================================================
   SEO
========================================================= */

export const metadata: Metadata = {
  title: "Himalayan Treks in India | Trekking & Expeditions",

  description:
    "Explore Himalayan treks in India, high-altitude adventures, trekking expeditions and mountain journeys with Bucketlist Adventure. Discover upcoming departures, itineraries and prices.",

  alternates: {
    canonical: PAGE_URL,
  },

  openGraph: {
    title:
      "Himalayan Treks in India | Bucketlist Adventure",

    description:
      "Discover Himalayan treks, high-altitude adventures and thoughtfully planned mountain journeys across India.",

    url: PAGE_URL,
    siteName: "Bucketlist Adventure",
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Himalayan Treks in India | Bucketlist Adventure",

    description:
      "Explore Himalayan treks, expeditions and high-altitude adventures across India.",
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
   MAPPING
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
          "Himalayan trip lookup failed:",
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
        "Himalayan batch lookup failed:",
        batchError
      );

      return defaultTrips;
    }

    const batches = (batchData || []) as BatchRow[];

    return (tripData as TripRow[]).map((trip) => {
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
    });
  } catch (error) {
    console.error(
      "Himalayan trips data load failed:",
      error
    );

    return defaultTrips;
  }
}

/* =========================================================
   HIMALAYAN FILTER
========================================================= */

function isHimalayanTrip(
  trip: TripData
): boolean {
  const searchable = [
    trip.title,
    String(trip.category || ""),
    trip.startPoint,
    trip.subtitle,
    trip.summary,
    trip.highlight,
    trip.description,
    trip.overview,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const signals = [
    "himalaya",
    "himalayan",
    "ladakh",
    "leh",
    "spiti",
    "kashmir",
    "uttarakhand",
    "himachal",
    "gangotri",
    "gaumukh",
    "tapovan",
    "kedarnath",
    "manali",
    "srinagar",
    "high altitude",
    "high-altitude",
    "expedition",
  ];

  return signals.some((signal) =>
    searchable.includes(signal)
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
  today.setHours(0, 0, 0, 0);

  const available = [...trip.batches]
    .filter((batch) => {
      const departure =
        new Date(batch.departureDate);

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
        new Date(a.departureDate).getTime() -
        new Date(b.departureDate).getTime()
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
      "Which are the best Himalayan treks in India?",
    answer:
      "The right Himalayan trek depends on your fitness, trekking experience, season and preferred difficulty. The Indian Himalayas offer everything from introductory mountain trails to demanding high-altitude expeditions across Uttarakhand, Himachal Pradesh, Ladakh and other Himalayan regions.",
  },
  {
    question:
      "Can beginners do a Himalayan trek?",
    answer:
      "Yes. Some Himalayan treks are suitable for first-time trekkers when approached with appropriate preparation and acclimatization. Beginners should choose a suitable difficulty level rather than selecting a trek only by altitude or popularity.",
  },
  {
    question:
      "What is the best time for Himalayan trekking?",
    answer:
      "The ideal season varies by route and region. Many Himalayan treks operate during spring, summer and autumn, while certain winter routes are specifically planned for colder conditions. Always check the season and itinerary of the individual trek.",
  },
  {
    question:
      "How should I prepare for a high-altitude trek?",
    answer:
      "Regular cardiovascular training, walking, stair climbing and strength work can help prepare your body for trekking. High-altitude journeys also require appropriate acclimatization, hydration and attention to the instructions provided by trek leaders.",
  },
  {
    question:
      "What should I carry for a Himalayan trek?",
    answer:
      "Requirements vary depending on altitude, weather, duration and route. Trekking shoes, layered clothing, personal medication and weather protection are commonly required. Each Bucketlist Adventure trip page provides a trip-specific Things to Carry list.",
  },
  {
    question:
      "Does Bucketlist Adventure organize Himalayan expeditions?",
    answer:
      "Bucketlist Adventure offers Himalayan trekking and mountain journeys ranging from group adventures to higher-altitude experiences. Available expeditions and upcoming departures are displayed on the website as they are scheduled.",
  },
];

/* =========================================================
   STRUCTURED DATA
========================================================= */

function createStructuredData(
  trips: TripData[]
) {
  return {
    "@context": "https://schema.org",

    "@graph": [
      {
        "@type": "BreadcrumbList",

        "@id":
          `${PAGE_URL}#breadcrumb`,

        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Himalayan Treks in India",
            item: PAGE_URL,
          },
        ],
      },

      {
        "@type": "ItemList",

        "@id":
          `${PAGE_URL}#trips`,

        name:
          "Himalayan Treks and Adventures in India",

        description:
          "Himalayan treks, expeditions and mountain journeys by Bucketlist Adventure.",

        numberOfItems:
          trips.length,

        itemListElement:
          trips.map(
            (trip, index) => ({
              "@type": "ListItem",

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
        "@type": "FAQPage",

        "@id":
          `${PAGE_URL}#faq`,

        mainEntity:
          faqs.map((faq) => ({
            "@type": "Question",

            name:
              faq.question,

            acceptedAnswer: {
              "@type": "Answer",

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

export default async function HimalayanTreksPage() {
  const allTrips =
    await getTrips();

  const himalayanTrips =
    allTrips.filter(
      isHimalayanTrip
    );

  const structuredData =
    createStructuredData(
      himalayanTrips
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
            Himalayas • Trekking • Expeditions
          </p>

          <h1 className="mt-5 max-w-5xl text-4xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-5xl lg:text-7xl">
            Himalayan treks
            <span className="block text-white/40">
              in India.
            </span>
          </h1>

          <p className="mt-7 max-w-3xl text-base leading-8 text-white/65 sm:text-lg">
            Explore high mountain trails,
            dramatic valleys and unforgettable
            Himalayan landscapes through
            thoughtfully planned treks,
            expeditions and adventure journeys
            across India.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">

            <a
              href="#himalayan-trips"
              className="inline-flex rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-400"
            >
              Explore Himalayan Trips ↓
            </a>

            <a
              href="https://wa.me/919225531257?text=Hi%20Bucketlist%20Adventure%2C%20I%20am%20interested%20in%20a%20Himalayan%20trek."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#17251d]"
            >
              Ask on WhatsApp ↗
            </a>

          </div>

          {/* TRUST */}
          <div className="mt-14 grid grid-cols-2 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] sm:grid-cols-4">

            {[
              ["Journeys", "Himalayas"],
              ["Experience", "High Altitude"],
              ["Approach", "Safety First"],
              ["Planning", "End to End"],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  className="border-b border-r border-white/10 p-5 sm:border-b-0"
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
              Into the mountains
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              More than reaching
              the summit.
            </h2>

          </div>

          <div className="space-y-5 text-[15px] leading-8 text-[#5d6862] sm:text-base">

            <p>
              The Indian Himalayas offer some
              of the world&apos;s most memorable
              mountain experiences — from
              valleys and alpine landscapes to
              remote villages, high passes and
              challenging expedition routes.
            </p>

            <p>
              A Himalayan journey requires more
              than simply choosing a destination.
              Route planning, acclimatization,
              weather, fitness, logistics and
              responsible mountain travel all
              play an important role.
            </p>

            <p>
              Bucketlist Adventure plans
              mountain journeys with an emphasis
              on thoughtful itineraries,
              coordination and safety so that
              travellers can experience the
              Himalayas with greater confidence.
            </p>

          </div>

        </div>

      </section>

      {/* TRIPS */}
      <section
        id="himalayan-trips"
        className="scroll-mt-10 px-6 pb-20 lg:px-10"
      >

        <div className="mx-auto max-w-6xl">

          <div className="mb-9 flex flex-col gap-5 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                Upcoming journeys
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Explore the Himalayas
              </h2>

            </div>

            <p className="text-sm text-[#5d6862]">
              {himalayanTrips.length}{" "}
              {himalayanTrips.length === 1
                ? "journey"
                : "journeys"}
            </p>

          </div>

          {himalayanTrips.length > 0 ? (

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {himalayanTrips.map(
                (trip) => {
                  const nextBatch =
                    getNextBatch(trip);

                  const duration =
                    getDuration(trip);

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
                      key={trip.slug}
                      href={`/trips/${trip.slug}`}
                      className="group overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_22px_55px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.1)]"
                    >

                      {/* IMAGE */}
                      <div
                        role="img"
                        aria-label={`${trip.title} Himalayan adventure`}
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
                            {trip.difficulty}
                          </span>
                        )}

                      </div>

                      <div className="p-6">

                        <div className="flex items-center justify-between gap-4">

                          <span className="text-[10px] font-bold uppercase tracking-[0.19em] text-orange-500">
                            {trip.startPoint ||
                              "Himalayas"}
                          </span>

                          <span className="text-xs font-semibold text-[#17251d]/55">
                            {duration}
                          </span>

                        </div>

                        <h3 className="mt-3 text-2xl font-bold tracking-tight">
                          {trip.title}
                        </h3>

                        {trip.summary && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5d6862]">
                            {trip.summary}
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
                                {seatsLeft} available
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
                              {displayPrice}
                            </p>

                          </div>

                          <span className="rounded-full bg-[#17251d] px-4 py-2.5 text-xs font-bold text-white transition group-hover:bg-orange-500">
                            View Journey ↗
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
                New Himalayan departures
                coming soon.
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-7 text-[#5d6862]">
                Contact Bucketlist Adventure
                for upcoming Himalayan trekking
                and expedition schedules.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* CHOOSE YOUR EXPERIENCE */}
      <section className="bg-white px-6 py-20 lg:px-10">

        <div className="mx-auto max-w-6xl">

          <div className="max-w-3xl">

            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              Choose wisely
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Find the mountain
              experience for you.
            </h2>

            <p className="mt-5 text-base leading-8 text-[#5d6862]">
              Altitude is only one part of
              choosing a Himalayan adventure.
              Consider your fitness, previous
              trekking experience, terrain,
              weather, duration and
              acclimatization requirements.
            </p>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">

            <InfoCard
              number="01"
              title="First Himalayan trek"
              text="Choose a manageable route with an appropriate altitude profile and enough time for your body to adapt."
            />

            <InfoCard
              number="02"
              title="High-altitude journeys"
              text="Longer and higher routes demand stronger preparation, responsible acclimatization and respect for changing mountain conditions."
            />

            <InfoCard
              number="03"
              title="Expedition mindset"
              text="For demanding mountain objectives, preparation, patience, teamwork and safety matter as much as reaching the destination."
            />

          </div>

        </div>

      </section>

      {/* SAFETY */}
      <section className="px-6 py-20 lg:px-10">

        <div className="mx-auto max-w-6xl">

          <div className="grid overflow-hidden rounded-[32px] border border-black/10 bg-white lg:grid-cols-2">

            <div className="p-8 sm:p-10 lg:p-12">

              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                High altitude
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Respect the mountain.
              </h2>

              <p className="mt-5 text-sm leading-7 text-[#5d6862]">
                Himalayan trekking requires
                patience. Gradual altitude gain,
                hydration, appropriate
                preparation and listening to
                your body are important parts
                of responsible high-altitude
                travel.
              </p>

            </div>

            <div className="bg-[#17251d] p-8 text-white sm:p-10 lg:p-12">

              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                Preparation
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Train before the trail.
              </h2>

              <p className="mt-5 text-sm leading-7 text-white/65">
                Build cardiovascular endurance,
                leg strength and regular walking
                into your preparation. The more
                demanding the route, the more
                important structured preparation
                becomes.
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
                Himalayan trekking
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently asked
                questions.
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#5d6862]">
                Useful information before
                choosing your Himalayan trek
                or mountain journey.
              </p>

            </div>

            <div className="space-y-3">

              {faqs.map((faq) => (

                <details
                  key={faq.question}
                  className="group rounded-[22px] border border-black/10 bg-white px-5 py-5"
                >

                  <summary className="flex cursor-pointer list-none items-start justify-between gap-5 font-semibold">

                    <span>
                      {faq.question}
                    </span>

                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5f3ee] text-lg transition group-open:rotate-45">
                      +
                    </span>

                  </summary>

                  <p className="mt-4 border-t border-black/10 pt-4 text-sm leading-7 text-[#5d6862]">
                    {faq.answer}
                  </p>

                </details>

              ))}

            </div>

          </div>

        </div>

      </section>

      {/* RELATED SEO */}
      <section className="px-6 pb-10 lg:px-10">

        <div className="mx-auto max-w-6xl">

          <div className="flex flex-col gap-5 rounded-[28px] border border-black/10 bg-white p-7 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                Looking for something closer?
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Explore weekend treks
                near Pune.
              </h2>

            </div>

            <Link
              href="/treks-near-pune"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#17251d] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-500"
            >
              Treks Near Pune ↗
            </Link>

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="px-6 pb-20 lg:px-10">

        <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#17251d] p-8 text-white sm:p-10 lg:p-14">

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                The mountains are calling
              </p>

              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Your Himalayan story
                <span className="block text-white/35">
                  starts with a plan.
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">
                Tell us your experience level,
                preferred dates and the kind of
                Himalayan adventure you&apos;re
                looking for.
              </p>

            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">

              <a
                href="https://wa.me/919225531257?text=Hi%20Bucketlist%20Adventure%2C%20please%20suggest%20a%20Himalayan%20trek."
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-400"
              >
                Get Trek Suggestions ↗
              </a>

              <Link
                href="/himalayan-treks-india"
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
