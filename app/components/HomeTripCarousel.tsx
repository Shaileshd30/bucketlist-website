"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TripBatch, TripData } from "../data/trips";

type Props = { trips: TripData[] | null; loadFailed: boolean };
type Card = { trip: TripData; batch: TripBatch | null; departures: number };
type Direction = "left" | "right";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function indiaToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function displayDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00+05:30`).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }
  );
}

function TripCard({ card, duplicate }: { card: Card; duplicate: boolean }) {
  const { trip, batch, departures } = card;
  const seats = batch
    ? Number(batch.totalSeats) - Number(batch.bookedSeats)
    : 0;
  return (
    <li
      aria-hidden={duplicate || undefined}
      className={`w-[82vw] max-w-[340px] shrink-0 sm:w-[330px] ${duplicate ? "motion-reduce:hidden" : ""}`}
    >
      <Link
        href={`/trips/${trip.slug}`}
        tabIndex={duplicate ? -1 : undefined}
        className="group grid h-full min-h-[190px] grid-cols-[42%_58%] overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_10px_25px_rgba(23,37,29,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(23,37,29,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 motion-reduce:transform-none"
      >
        <div className="relative min-h-[190px] overflow-hidden bg-[#dfe5dd]">
          {trip.image && (
            <Image
              src={trip.image}
              alt={trip.title}
              fill
              unoptimized
              sizes="(max-width: 640px) 35vw, 140px"
              className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold">
            {trip.duration ||
              (trip.durationDays ? `${trip.durationDays} days` : "View itinerary")}
          </span>
        </div>
        <div className="flex min-w-0 flex-col p-4">
          <h3 className="line-clamp-2 text-base font-bold leading-snug">{trip.title}</h3>
          <p className="mt-2 text-xs text-[#5d6862]">
            {batch ? displayDate(batch.departureDate) : "Dates on request"}
          </p>
          <p className="mt-1 text-[11px] text-[#5d6862]">
            {!batch
              ? "Ask us for the next available date"
              : departures > 1
              ? `+${departures - 1} more departure${departures > 2 ? "s" : ""}`
              : `${seats} seat${seats === 1 ? "" : "s"} available`}
          </p>
          <div className="mt-auto pt-4">
            <p className="text-[10px] text-[#5d6862]">
              {batch ? "Per person" : "Availability"}
            </p>
            <p className="text-xl font-bold">
              {batch ? money(Number(batch.price)) : "On request"}
            </p>
            <span className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-xs font-bold">
              View Trip
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#17251d] text-white transition group-hover:bg-orange-500"
              >
                ↗
              </span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function CategoryLane({
  id,
  eyebrow,
  title,
  cards,
  direction,
}: {
  id: string;
  eyebrow: string;
  title: string;
  cards: Card[];
  direction: Direction;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const interacting = useRef(false);
  const [paused, setPaused] = useState(false);
  const repeats = cards.length > 1 ? Math.ceil(6 / cards.length) : 1;
  const loopSize = cards.length * repeats;
  const flowingCards =
    cards.length > 1
      ? Array.from({ length: repeats * 2 }, () => cards).flat()
      : cards;

  useEffect(() => {
    const lane = laneRef.current;
    const track = trackRef.current;
    if (!lane || !track || paused || cards.length < 2) return;
    const activeTrack = track;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let frame = 0;
    let previous = 0;
    let position = activeTrack.scrollLeft;
    let initialized = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(lane);

    function animate(time: number) {
      const first = activeTrack.children[0] as HTMLElement | undefined;
      const nextGroup = activeTrack.children[loopSize] as HTMLElement | undefined;
      const period = first && nextGroup ? nextGroup.offsetLeft - first.offsetLeft : 0;

      if (period > 0 && !initialized) {
        position = direction === "right" ? period : 0;
        activeTrack.scrollLeft = position;
        initialized = true;
      }

      const elapsed = previous ? Math.min(time - previous, 50) : 0;
      previous = time;
      if (
        initialized &&
        visible &&
        !interacting.current &&
        !document.hidden &&
        !reducedMotion.matches &&
        !activeTrack.contains(document.activeElement)
      ) {
        position += (direction === "left" ? 1 : -1) * elapsed * 0.021;
        if (position >= period) position -= period;
        if (position < 0) position += period;
        activeTrack.scrollLeft = position;
      } else {
        position = activeTrack.scrollLeft;
      }
      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [cards.length, direction, loopSize, paused]);

  function move(directionValue: number) {
    setPaused(true);
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>("li");
    if (!track || !card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    track.scrollBy({
      left: directionValue * (card.offsetWidth + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  if (!cards.length) return null;

  return (
    <div ref={laneRef} className="border-t border-[#17251d]/10 py-7 first:border-t-0">
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-600">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h3>
        </div>
        {cards.length > 1 && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-controls={id}
              className="hidden rounded-full border border-[#17251d]/20 px-3 py-2 text-[11px] font-semibold hover:bg-white focus-visible:outline-2 focus-visible:outline-orange-500 sm:block motion-reduce:hidden"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button type="button" onClick={() => move(-1)} aria-label={`Previous ${title}`} aria-controls={id} className="h-9 w-9 rounded-full border border-[#17251d]/20 bg-white text-sm hover:bg-[#e7ece5] focus-visible:outline-2 focus-visible:outline-orange-500">←</button>
            <button type="button" onClick={() => move(1)} aria-label={`Next ${title}`} aria-controls={id} className="h-9 w-9 rounded-full bg-[#17251d] text-sm text-white hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-orange-500">→</button>
          </div>
        )}
      </div>
      <ul
        ref={trackRef}
        id={id}
        aria-label={title}
        onMouseEnter={() => { interacting.current = true; }}
        onMouseLeave={() => { interacting.current = false; }}
        onFocusCapture={() => setPaused(true)}
        onPointerDown={() => { interacting.current = true; setPaused(true); }}
        onPointerUp={() => { interacting.current = false; }}
        onWheel={() => setPaused(true)}
        className="relative flex gap-4 overflow-x-auto overscroll-x-contain px-1 pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {flowingCards.map((card, index) => (
          <TripCard
            key={`${card.trip.slug}-${index}`}
            card={card}
            duplicate={index >= cards.length}
          />
        ))}
      </ul>
    </div>
  );
}

export default function HomeTripCarousel({ trips, loadFailed }: Props) {
  const today = indiaToday();
  const cards = (trips ?? [])
    .filter((trip) => trip.upcoming === true)
    .map((trip) => {
      const batches = (trip.batches ?? [])
        .filter(
          (batch) =>
            batch.visibility === "PUBLIC" &&
            batch.status === "OPEN" &&
            batch.bookingEnabled &&
            batch.departureDate?.slice(0, 10) >= today &&
            Number(batch.totalSeats) > Number(batch.bookedSeats) &&
            Number.isFinite(Number(batch.price)) &&
            Number(batch.price) > 0
        )
        .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
      return {
        trip,
        batch: batches[0] ?? null,
        departures: batches.length,
      };
    })
    .sort((a, b) => {
      if (a.batch && b.batch) {
        return a.batch.departureDate.localeCompare(b.batch.departureDate);
      }
      if (a.batch) return -1;
      if (b.batch) return 1;
      return a.trip.title.localeCompare(b.trip.title);
    });

  const trekking = cards.filter(
    ({ trip }) => trip.travelCategory === "Treks & Adventures"
  );
  const international = cards.filter(
    ({ trip }) => trip.travelCategory === "International Tours"
  );
  const domestic = cards.filter(
    ({ trip }) => trip.travelCategory === "Domestic Tours"
  );

  return (
    <section
      id="adventures"
      aria-labelledby="home-trips-heading"
      className="relative scroll-mt-24 bg-[#f5f3ee] px-5 py-12 text-[#17251d] sm:px-6 sm:py-16 lg:px-10"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-5 sm:mb-7">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-600">
              Upcoming departures
            </p>
            <h2 id="home-trips-heading" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Your Next Adventure
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#5d6862] sm:text-base">
              Explore the Sahyadris, discover India and journey beyond borders.
            </p>
          </div>
          <Link href="/trips" className="rounded-full border border-[#17251d]/20 px-5 py-3 text-sm font-semibold transition hover:bg-[#17251d] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500">
            View All Trips <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {!trips && !loadFailed ? (
          <div role="status" className="rounded-3xl border border-black/10 bg-white p-8 text-[#5d6862]">
            Loading upcoming adventures…
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white p-8">
            <p className="text-lg font-semibold">
              {loadFailed
                ? "Upcoming trips are temporarily unavailable."
                : "New adventures are being planned."}
            </p>
            <p className="mt-2 text-sm text-[#5d6862]">
              Explore our trips or let us help plan a journey for you.
            </p>
            <a href="https://wa.me/919225531257" className="mt-5 inline-flex rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500">
              Plan a custom trip
            </a>
          </div>
        ) : (
          <div>
            <CategoryLane id="trekking-trip-track" eyebrow="Into the wild" title="Treks & Adventures" cards={trekking} direction="left" />
            <CategoryLane id="domestic-trip-track" eyebrow="Across India" title="Domestic Journeys" cards={domestic} direction="right" />
            <CategoryLane id="international-trip-track" eyebrow="Beyond borders" title="International Tours" cards={international} direction="left" />
          </div>
        )}
      </div>
    </section>
  );
}
