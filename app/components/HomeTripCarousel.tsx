"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TripBatch, TripData } from "../data/trips";

type CarouselTrip = TripData & { stayPlan?: string };
type Props = { trips: CarouselTrip[] | null; loadFailed: boolean };
type Card = { trip: CarouselTrip; batch: TripBatch | null; departures: number };
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
  const photos = Array.from(
    new Set(
      [trip.image, ...(trip.gallery || [])].filter(
        (photo): photo is string => Boolean(photo)
      )
    )
  ).slice(0, 6);
  const [photoIndex, setPhotoIndex] = useState(0);
  const seats = batch
    ? Number(batch.totalSeats) - Number(batch.bookedSeats)
    : 0;
  const destination = trip.destination || trip.startPoint || "Adventure travel";
  const enquiryUrl = `https://wa.me/919225531257?text=${encodeURIComponent(
    `Hi Bucketlist Adventure! I am interested in ${trip.title}. Please share the available dates, price and booking details.`
  )}`;

  return (
    <li
      aria-hidden={duplicate || undefined}
      className={`w-[84vw] max-w-[370px] shrink-0 sm:w-[350px] lg:w-[360px] ${duplicate ? "motion-reduce:hidden" : ""}`}
    >
      <article className="group flex h-full min-h-[500px] flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-[0_12px_30px_rgba(23,37,29,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(23,37,29,0.14)] motion-reduce:transform-none">
        <div className="group/media relative h-[240px] shrink-0 overflow-hidden bg-[#dfe5dd]">
          <Link
            href={`/trips/${trip.slug}`}
            tabIndex={duplicate ? -1 : undefined}
            className="absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-orange-500"
            aria-label={`View ${trip.title}`}
          >
          {photos[photoIndex] && (
            <Image
              src={photos[photoIndex]}
              alt={`${trip.title}${photos.length > 1 ? ` — photo ${photoIndex + 1}` : ""}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 84vw, 370px"
              className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.04]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
          </Link>
          <span className={`absolute left-0 top-4 px-3.5 py-2 text-xs font-bold tracking-wide text-white shadow-sm ${batch ? "bg-orange-600" : "bg-[#17251d]"}`}>
            {batch ? `Next · ${displayDate(batch.departureDate)}` : "Dates on request"}
          </span>
          <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#17251d] shadow-sm backdrop-blur-sm">
            {trip.duration ||
              (trip.durationDays ? `${trip.durationDays} days` : "View itinerary")}
          </span>
          {departures > 1 && (
            <span className="absolute bottom-4 right-4 rounded-full bg-[#17251d]/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {departures} departures
            </span>
          )}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPhotoIndex((current) => (current - 1 + photos.length) % photos.length)}
                tabIndex={duplicate ? -1 : undefined}
                aria-label={`Previous photo of ${trip.title}`}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-[#17251d] opacity-100 shadow-md backdrop-blur-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-orange-500 sm:opacity-0 sm:group-hover/media:opacity-100 sm:group-focus-within/media:opacity-100"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                onClick={() => setPhotoIndex((current) => (current + 1) % photos.length)}
                tabIndex={duplicate ? -1 : undefined}
                aria-label={`Next photo of ${trip.title}`}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-[#17251d] opacity-100 shadow-md backdrop-blur-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-orange-500 sm:opacity-0 sm:group-hover/media:opacity-100 sm:group-focus-within/media:opacity-100"
              >
                <span aria-hidden="true">→</span>
              </button>
              <span className="absolute right-4 top-4 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {photoIndex + 1} / {photos.length}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            {destination}
          </p>

          <Link
            href={`/trips/${trip.slug}`}
            tabIndex={duplicate ? -1 : undefined}
            className="mt-2 line-clamp-2 text-xl font-bold leading-snug tracking-tight text-[#17251d] decoration-orange-500 decoration-2 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-orange-500"
          >
            {trip.title}
          </Link>

          {(trip.durationDays || 0) > 1 && (
            <p
              title={trip.stayPlan || "View day-wise itinerary"}
              className="mt-3 min-h-[52px] overflow-hidden rounded-lg bg-[#f5f3ee] px-3 py-2 text-[13px] font-semibold leading-[18px] text-[#34483d]"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
            >
              {trip.stayPlan || "View day-wise itinerary"}
            </p>
          )}

          <div className="mt-4 flex min-h-10 items-start gap-2 border-b border-black/10 pb-4 text-sm leading-5 text-[#5d6862]">
            <span aria-hidden="true" className="mt-0.5 text-[#17251d]">●</span>
            <p>
              {!batch
                ? "Tell us your preferred dates for a custom quote."
                : `${seats} seat${seats === 1 ? "" : "s"} currently available${departures > 1 ? ` across ${departures} departures` : ""}.`}
            </p>
          </div>

          <div className="mt-auto flex items-end justify-between gap-4 pt-5">
            <div>
              <p className="text-xs font-medium text-[#5d6862]">
                {batch ? "From / person" : "Availability"}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#17251d]">
                {batch ? money(Number(batch.price)) : "On request"}
              </p>
            </div>

            {batch && (
              <p className="max-w-[110px] text-right text-xs leading-4 text-[#5d6862]">
                Final price shown on trip page
              </p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-2.5">
            <Link
              href={`/trips/${trip.slug}`}
              tabIndex={duplicate ? -1 : undefined}
              className="flex min-h-12 items-center justify-center rounded-xl bg-[#17251d] px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              View trip <span className="ml-2" aria-hidden="true">↗</span>
            </Link>
            <a
              href={enquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={duplicate ? -1 : undefined}
              aria-label={`Enquire about ${trip.title} on WhatsApp`}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#17251d]/20 bg-[#f5f3ee] text-lg font-bold text-[#17251d] transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-[22px] w-[22px] fill-current"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.892-9.884a9.82 9.82 0 0 1 7.021 2.91 9.83 9.83 0 0 1 2.898 7.021c-.003 5.45-4.445 9.884-9.927 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
              </svg>
            </a>
          </div>
        </div>
      </article>
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
