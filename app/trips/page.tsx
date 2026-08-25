"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { defaultTrips, tripCategories, type TripData } from "../data/trips";

export default function TripsPage() {
  const [trips, setTrips] = useState<TripData[]>(defaultTrips);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const response = await fetch("/api/trips", { cache: "no-store" });

        if (!response.ok) {
          setTrips(defaultTrips);
          return;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setTrips(data);
          return;
        }
      } catch {
        // Fall back to default dataset
      }

      setTrips(defaultTrips);
    };

    loadTrips();
  }, []);

  const groupedTrips = useMemo(
    () =>
      tripCategories.reduce(
        (acc, category) => {
          acc[category] = trips.filter(
            (trip) => trip.category === category
          );
          return acc;
        },
        {} as Record<string, TripData[]>
      ),
    [trips]
  );

  /**
   * Returns the next public/open batch for a trip.
   */
  const getNextBatch = (trip: TripData) => {
    if (!trip.batches || trip.batches.length === 0) {
      return null;
    }

    const availableBatches = trip.batches
      .filter(
        (batch) =>
          batch.visibility === "PUBLIC" &&
          batch.status === "OPEN" &&
          batch.bookingEnabled
      )
      .sort(
        (a, b) =>
          new Date(a.departureDate).getTime() -
          new Date(b.departureDate).getTime()
      );

    return availableBatches[0] ?? null;
  };

  /**
   * Formats a date like:
   * 29 Aug 2026
   */
  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /**
   * Formats price like:
   * ₹1,999
   */
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">

        {/* Back button */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
        >
          ← Back to home
        </Link>

        {/* Page heading */}
        <div className="mb-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
            Bucketlist trips
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Choose your next mountain story
          </h1>
        </div>

        {/* Categories */}
        <div className="space-y-12">
          {tripCategories.map((category) => {
            const categoryTrips = groupedTrips[category] ?? [];

            if (categoryTrips.length === 0) {
              return null;
            }

            return (
              <section key={category} className="space-y-6">

                {/* Category heading */}
                <div className="flex items-end justify-between gap-4 border-b border-black/10 pb-4">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
                      Category
                    </p>

                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      {category}
                    </h2>
                  </div>

                  <span className="text-sm font-medium text-[#17251d]/70">
                    {categoryTrips.length} trips
                  </span>
                </div>

                {/* Trip cards */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {categoryTrips.map((trip) => {
                    const nextBatch = getNextBatch(trip);

                    const displayPrice = nextBatch
                      ? formatPrice(nextBatch.price)
                      : trip.price ?? "Price on request";

                    const displayDuration =
                      trip.duration ??
                      (trip.durationDays
                        ? `${trip.durationDays} ${
                            trip.durationDays === 1 ? "Day" : "Days"
                          }`
                        : "Flexible");

                    return (
                      <Link
                        key={trip.slug}
                        href={`/trips/${trip.slug}`}
                        className="group overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.12)]"
                      >
                        {/* Image */}
                        <div
                          className="h-56 bg-cover bg-center"
                          style={{
                            backgroundImage: `url('${trip.image}')`,
                          }}
                        />

                        <div className="p-6">

                          {/* Location + duration */}
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <span className="rounded-full bg-[#f7f5f2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]">
                              {trip.startPoint}
                            </span>

                            <span className="text-xs font-medium uppercase tracking-[0.2em] text-orange-500">
                              {displayDuration}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-2xl font-bold text-[#17251d]">
                            {trip.title}
                          </h3>

                          {/* Summary */}
                          <p className="mt-3 text-sm leading-6 text-[#5d6862]">
                            {trip.summary}
                          </p>

                          {/* Next departure */}
                          {nextBatch && (
                            <div className="mt-5 rounded-2xl bg-[#f7f5f2] px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                                Next departure
                              </p>

                              <p className="mt-1 text-sm font-semibold text-[#17251d]">
                                {formatDate(nextBatch.departureDate)}
                              </p>
                            </div>
                          )}

                          {/* Price + CTA */}
                          <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/10 pt-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                                From
                              </p>

                              <p className="mt-1 font-semibold text-[#17251d]">
                                {displayPrice}
                              </p>
                            </div>

                            <span className="inline-flex items-center gap-2 rounded-full bg-[#17251d] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition group-hover:bg-orange-500">
                              View trip
                              <span aria-hidden="true">↗</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}