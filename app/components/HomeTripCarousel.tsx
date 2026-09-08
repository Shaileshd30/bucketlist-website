"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TripData } from "../data/trips";

type Props = { trips: TripData[] | null; loadFailed: boolean };

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(value);

function indiaToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function moveTrack(track: HTMLUListElement, direction: number, smooth: boolean) {
  const card = track.querySelector<HTMLElement>("li");
  if (!card) return;
  const step = card.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  if (max < 2) return;
  const atEnd = track.scrollLeft >= max - 4;
  const atStart = track.scrollLeft <= 4;
  const left = direction > 0 && atEnd ? 0
    : direction < 0 && atStart ? max
    : Math.max(0, Math.min(max, track.scrollLeft + direction * step));
  track.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
}

export default function HomeTripCarousel({ trips, loadFailed }: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hovering = useRef(false);
  const [paused, setPaused] = useState(false);
  const today = indiaToday();
  const cards = (trips ?? [])
    .filter((trip) => trip.upcoming === true)
    .flatMap((trip) => {
      const batches = (trip.batches ?? []).filter((batch) =>
        batch.visibility === "PUBLIC" && batch.status === "OPEN" &&
        batch.bookingEnabled && batch.departureDate?.slice(0, 10) >= today &&
        Number(batch.totalSeats) > Number(batch.bookedSeats) &&
        Number.isFinite(Number(batch.price)) && Number(batch.price) > 0
      ).sort((a, b) => a.departureDate.localeCompare(b.departureDate));
      return batches.length ? [{ trip, batch: batches[0], departures: batches.length }] : [];
    })
    .sort((a, b) => a.batch.departureDate.localeCompare(b.batch.departureDate));

  // Repeat a complete group wide enough to cover the viewport, then duplicate
  // that group for a seamless loop. Only the first occurrence is accessible.
  const repeats = cards.length > 1 ? Math.ceil(5 / cards.length) : 1;
  const loopSize = cards.length * repeats;
  const flowingCards = cards.length > 1
    ? Array.from({ length: repeats * 2 }, () => cards).flat()
    : cards;

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || paused || cards.length < 2) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let frame = 0;
    let previous = 0;
    let position = track.scrollLeft;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { threshold: 0.15 });
    observer.observe(section);

    function animate(time: number) {
      if (!track) return;
      const elapsed = previous ? Math.min(time - previous, 50) : 0;
      previous = time;
      const first = track.children[0] as HTMLElement | undefined;
      const nextGroup = track.children[loopSize] as HTMLElement | undefined;
      const period = first && nextGroup ? nextGroup.offsetLeft - first.offsetLeft : 0;
      if (visible && !hovering.current && !document.hidden &&
        !reducedMotion.matches && !track.contains(document.activeElement) && period > 0) {
        position = (position + elapsed * 0.028) % period;
        track.scrollLeft = position;
      } else {
        position = track.scrollLeft;
      }
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [paused, cards.length, loopSize]);

  function navigate(direction: number) {
    setPaused(true);
    if (trackRef.current) {
      moveTrack(trackRef.current, direction,
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }

  return (
    <section ref={sectionRef} id="adventures" aria-labelledby="home-trips-heading"
      className="relative scroll-mt-24 bg-[#f5f3ee] px-5 py-12 text-[#17251d] sm:px-6 sm:py-16 lg:px-10"
      onMouseEnter={() => { hovering.current = true; }}
      onMouseLeave={() => { hovering.current = false; }}>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-5 sm:mb-8">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-600">Upcoming departures</p>
            <h2 id="home-trips-heading" className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Your Next Adventure</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#5d6862] sm:text-base">Find your trip. Pick your dates. We take care of the planning.</p>
          </div>
          <Link href="/trips" className="rounded-full border border-[#17251d]/20 px-5 py-3 text-sm font-semibold transition hover:bg-[#17251d] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500">View All Trips <span aria-hidden="true">↗</span></Link>
        </div>

        {!trips && !loadFailed ? (
          <div role="status" className="rounded-3xl border border-black/10 bg-white p-8 text-[#5d6862]">Loading upcoming adventures…</div>
        ) : cards.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white p-8">
            <p className="text-lg font-semibold">{loadFailed ? "Upcoming trips are temporarily unavailable." : "New adventures are being planned."}</p>
            <p className="mt-2 text-sm text-[#5d6862]">Explore our trips or let us help plan a journey for you.</p>
            <a href="https://wa.me/919225531257" className="mt-5 inline-flex rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500">Plan a custom trip</a>
          </div>
        ) : (
          <>
            <ul ref={trackRef} id="home-trip-track" aria-label="Upcoming trips"
              onFocusCapture={() => setPaused(true)} onPointerDown={() => setPaused(true)} onWheel={() => setPaused(true)}
              className="relative flex gap-5 overflow-x-auto overscroll-x-contain px-1 pb-8 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarColor: "#87958b #e7e5dd" }}>
              {flowingCards.map(({ trip, batch, departures }, index) => {
                const seats = Number(batch.totalSeats) - Number(batch.bookedSeats);
                const date = new Date(`${batch.departureDate.slice(0, 10)}T00:00:00+05:30`)
                  .toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
                return (
                  <li key={`${trip.slug}-${index}`} aria-hidden={index >= cards.length ? true : undefined} className={`flex w-[86%] max-w-[370px] shrink-0 sm:w-[calc(50%_-_10px)] lg:w-[calc(33.333%_-_13.333px)] xl:w-[calc(25%_-_15px)] ${index >= cards.length ? "motion-reduce:hidden" : ""}`}>
                    <Link href={`/trips/${trip.slug}`} tabIndex={index >= cards.length ? -1 : undefined} className="group flex w-full flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-[0_12px_28px_rgba(23,37,29,0.07)] transition duration-300 hover:shadow-[0_18px_32px_rgba(23,37,29,0.12)] motion-safe:hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#dfe5dd]">
                        {trip.image && <Image src={trip.image} alt={trip.title} fill unoptimized
                          sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 86vw"
                          className="object-cover transition duration-500 motion-safe:group-hover:scale-105" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold">{trip.duration || (trip.durationDays ? `${trip.durationDays} days` : "View itinerary")}</span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">{trip.travelCategory || trip.category}</p>
                        <h3 className="mt-2 text-xl font-bold leading-snug">{trip.title}</h3>
                        <p className="mt-3 text-sm text-[#5d6862]">Next departure · {date}</p>
                        <p className="mt-1 text-xs text-[#5d6862]">{departures > 1 ? `+${departures - 1} more departure${departures > 2 ? "s" : ""}` : `${seats} seat${seats === 1 ? "" : "s"} available`}</p>
                        <div className="mt-auto pt-5">
                          <p className="text-[11px] text-[#5d6862]">Per person · next departure</p>
                          <p className="mt-1 text-2xl font-bold">{money(Number(batch.price))}</p>
                          <span className="mt-5 flex items-center justify-between border-t border-black/10 pt-4 text-sm font-semibold">View Trip <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17251d] text-white transition group-hover:bg-orange-500">↗</span></span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {cards.length > 1 && <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#5d6862]">Swipe or use the arrows to explore</p>
              <div className="flex items-center gap-2">
                <button type="button" aria-controls="home-trip-track" onClick={() => setPaused(!paused)} className="rounded-full border border-[#17251d]/20 px-4 py-3 text-xs font-semibold hover:bg-white focus-visible:outline-2 focus-visible:outline-orange-500 motion-reduce:hidden">{paused ? "Resume movement" : "Pause movement"}</button>
                <button type="button" aria-label="Previous trips" aria-controls="home-trip-track" onClick={() => navigate(-1)} className="h-11 w-11 rounded-full border border-[#17251d]/20 bg-white hover:bg-[#e7ece5] focus-visible:outline-2 focus-visible:outline-orange-500">←</button>
                <button type="button" aria-label="Next trips" aria-controls="home-trip-track" onClick={() => navigate(1)} className="h-11 w-11 rounded-full bg-[#17251d] text-white hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-orange-500">→</button>
              </div>
            </div>}
          </>
        )}
      </div>
    </section>
  );
}
