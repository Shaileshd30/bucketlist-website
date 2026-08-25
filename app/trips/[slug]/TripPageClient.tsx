"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { defaultTrips, type TripBatch, type TripData } from "../../data/trips";

type BookingFormState = {
  name: string;
  phone: string;
  travelers: string;
  message: string;
};

export function TripPageClient({ trip }: { trip: TripData }) {
  const [selectedImage, setSelectedImage] = useState<string>(trip.image || "");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const [booking, setBooking] = useState<BookingFormState>({
    name: "",
    phone: "",
    travelers: "1",
    message: `I'm interested in ${trip.title}. Please share the available dates and details.`,
  });

  useEffect(() => {
    const gallery =
      trip.gallery && trip.gallery.length > 0
        ? trip.gallery
        : [trip.image].filter(Boolean);

    setSelectedImage((current) =>
      current && gallery.includes(current)
        ? current
        : gallery[0] || trip.image || ""
    );
  }, [trip]);

  const gallery = useMemo(() => {
    const items =
      trip.gallery && trip.gallery.length > 0
        ? trip.gallery
        : [trip.image].filter(Boolean);

    return Array.from(new Set(items.filter(Boolean)));
  }, [trip]);

  const primaryImage = selectedImage || gallery[0] || trip.image;

  const overview = trip.overview || trip.description || "";
  const itinerary = trip.itinerary || [];
  const includes = trip.includes || [];
  const excludes = trip.notIncludes || [];
  const pickupPoints = trip.pickupPoints || [];
  const thingsToCarry = trip.thingsToCarry || [];
  const medicalDisclaimer = trip.medicalDisclaimer || [];
  const rules = trip.rules || [];

  /*
   * Available public batches
   */
  const availableBatches = useMemo(() => {
    if (!trip.batches || trip.batches.length === 0) {
      return [];
    }

    return [...trip.batches]
      .filter(
        (batch) =>
          batch.visibility === "PUBLIC" &&
          batch.status === "OPEN" &&
          batch.bookingEnabled &&
          batch.totalSeats - (batch.bookedSeats || 0) > 0
      )
      .sort(
        (a, b) =>
          new Date(a.departureDate).getTime() -
          new Date(b.departureDate).getTime()
      );
  }, [trip]);

  /*
   * Select the first available batch automatically.
   */
  useEffect(() => {
    if (availableBatches.length === 0) {
      setSelectedBatchId("");
      return;
    }

    setSelectedBatchId((current) => {
      const stillAvailable = availableBatches.some(
        (batch) => batch.id === current
      );

      return stillAvailable ? current : availableBatches[0].id;
    });
  }, [availableBatches]);

  const selectedBatch: TripBatch | null =
    availableBatches.find((batch) => batch.id === selectedBatchId) || null;
    const nextBatch = availableBatches[0] || null;

const displayBatch = selectedBatch || nextBatch;

const displayDuration = trip.durationDays
  ? `${trip.durationDays} ${trip.durationDays === 1 ? "Day" : "Days"}`
  : trip.duration || "Flexible";

const displayAvailableSeats = displayBatch
  ? Math.max(
      0,
      displayBatch.totalSeats - (displayBatch.bookedSeats || 0)
    )
  : null;

  /*
   * Helpers
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

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const travelerCount = Math.max(
    1,
    Number.parseInt(booking.travelers || "1", 10) || 1
  );

  const currentPrice =
  displayBatch?.price ??
  (trip.price
    ? Number(trip.price.replace(/[^0-9]/g, "")) || 0
    : 0);

  const totalAmount = currentPrice * travelerCount;

  const availableSeats = displayAvailableSeats;

  const isEnoughSeats =
    availableSeats === null ||
    (availableSeats > 0 && travelerCount <= availableSeats);

  /*
   * WhatsApp enquiry
   */
  const submitBooking = (event: React.FormEvent) => {
    event.preventDefault();

    const selectedDate = selectedBatch
      ? formatDate(selectedBatch.departureDate)
      : "Flexible / To be confirmed";

    const message = [
      `Hi Bucketlist Adventure,`,
      ``,
      `I am interested in ${trip.title}.`,
      ``,
      selectedBatch
        ? `Departure: ${selectedDate}`
        : "Departure: Please suggest available dates.",
      `Travelers: ${travelerCount}`,
      currentPrice ? `Price per person: ${formatPrice(currentPrice)}` : "",
      currentPrice ? `Estimated total: ${formatPrice(totalAmount)}` : "",
      booking.name ? `Name: ${booking.name}` : "",
      booking.phone ? `Phone: ${booking.phone}` : "",
      booking.message ? `Message: ${booking.message}` : "",
      ``,
      `Please share the next steps.`,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/918482846287?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /*
   * Direct booking
   *
   * For now this sends the customer to our booking page.
   * We will build the actual registration + payment system
   * in the next phase.
   */
  const handleBookNow = () => {
    if (!selectedBatch) {
      return;
    }

    if (!isEnoughSeats) {
      alert("Please reduce the number of travelers.");
      return;
    }

    const params = new URLSearchParams({
      trip: trip.slug,
      batch: selectedBatch.id,
      travelers: String(travelerCount),
    });

    window.location.href = `/book?${params.toString()}`;
  };

  const renderItineraryItem = (
    item:
      | string
      | {
          day?: string;
          time?: string;
          activity: string;
        }
  ) => {
    if (typeof item === "string") {
      return item;
    }

    return (
      <>
        {(item.day || item.time) && (
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#17251d]/60">
            {[item.day, item.time].filter(Boolean).join(" ")}
          </span>
        )}

        <span>{item.activity}</span>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">

        {/* Back */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
        >
          ← Back to home
        </Link>

        {/* HERO */}
        <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">

            <div
              className="min-h-[380px] bg-cover bg-center"
              style={{
                backgroundImage: `url('${primaryImage || trip.image}')`,
              }}
            />

            <div className="p-8 lg:p-10">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                {trip.startPoint}
              </p>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {trip.title}
              </h1>

              <p className="mt-3 text-lg text-[#5d6862]">
                {trip.subtitle}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-[#17251d]">

                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                    From
                  </p>

                  <p className="mt-2 font-semibold">
                    {currentPrice
                      ? formatPrice(currentPrice)
                      : trip.price || "On request"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                    Duration
                  </p>

                  <p className="mt-2 font-semibold">
                    {displayDuration}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                    Next departure
                  </p>

                  <p className="mt-2 font-semibold">
                      {displayBatch
                      ? formatDate(displayBatch.departureDate)
                      : "On request"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                    Difficulty
                  </p>

                  <p className="mt-2 font-semibold">
                    {trip.difficulty}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleBookNow}
                  disabled={!selectedBatch || !isEnoughSeats}
                  className="inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Book Now
                </button>

                <a
                  href={`https://wa.me/918482846287?text=${encodeURIComponent(
                    `Hi Bucketlist Adventure, I'm interested in ${
                      trip.title
                    }${
                      selectedBatch
                        ? ` for ${formatDate(selectedBatch.departureDate)}`
                        : ""
                    }. We are ${travelerCount} traveler(s). Please share the details.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[#17251d]/15 bg-white px-6 py-4 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
                >
                  Enquire on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* GALLERY */}
        {gallery.length > 0 && (
          <div className="mt-10 rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Photo gallery
              </p>

              <span className="text-sm text-[#5d6862]">
                {gallery.length} images
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_0.7fr]">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="overflow-hidden rounded-[24px] border border-black/10 bg-[#f7f5f2] text-left"
              >
                <div
                  className="h-[420px] w-full bg-cover bg-center transition duration-300 hover:scale-[1.01]"
                  style={{
                    backgroundImage: `url('${primaryImage}')`,
                  }}
                />
              </button>

              <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-[18px] border transition ${
                      primaryImage === image
                        ? "border-orange-500 ring-2 ring-orange-200"
                        : "border-black/10"
                    }`}
                  >
                    <div className="h-28 w-full overflow-hidden bg-[#f7f5f2]">
                      <img
                        src={image}
                        alt={`${trip.title} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX */}
        {isLightboxOpen && primaryImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#101712]/80 p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1411] shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/85 px-3 py-2 text-sm font-semibold text-[#17251d]"
              >
                Close
              </button>

              <div className="flex h-[75vh] w-full items-center justify-center bg-[#0d1411]">
                <img
                  src={primaryImage}
                  alt={`${trip.title} full size`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">

          <div className="space-y-8">

            {/* Overview */}
            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Overview
              </p>

              <p className="text-lg leading-8 text-[#5d6862] whitespace-pre-line">
                {overview}
              </p>

              <div className="mt-10">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Itinerary
                </p>

                <ol className="space-y-4">
                  {itinerary.map((item, index) => (
                    <li
                      key={`${
                        typeof item === "string"
                          ? item
                          : item.activity
                      }-${index}`}
                      className="flex gap-4 rounded-2xl bg-[#f7f5f2] p-4"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17251d] text-xs font-bold text-white">
                        {index + 1}
                      </span>

                      <p className="text-[#17251d]">
                        {renderItineraryItem(item)}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Pickup */}
            {pickupPoints.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Pickup Points
                </p>

                <ul className="space-y-2 text-[#17251d]">
                  {pickupPoints.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="rounded-2xl bg-[#f7f5f2] p-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Things to carry */}
            {thingsToCarry.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Things to Carry
                </p>

                <ul className="space-y-2 text-[#17251d]">
                  {thingsToCarry.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-start gap-2 rounded-2xl bg-[#f7f5f2] p-3"
                    >
                      <span className="mt-1 text-orange-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Medical */}
            {medicalDisclaimer.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Medical Disclaimer
                </p>

                <ul className="space-y-2 text-[#17251d]">
                  {medicalDisclaimer.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="rounded-2xl bg-[#f7f5f2] p-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rules */}
            {rules.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Rules
                </p>

                <ul className="space-y-2 text-[#17251d]">
                  {rules.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-start gap-2 rounded-2xl bg-[#f7f5f2] p-3"
                    >
                      <span className="mt-1 text-red-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">

            {/* BOOKING CARD */}
            <div
              id="booking-form"
              className="sticky top-6 rounded-[28px] border border-black/10 bg-[#17251d] p-8 text-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                Book your adventure
              </p>

              <h3 className="text-4xl font-bold">
                {currentPrice
                  ? formatPrice(currentPrice)
                  : trip.price || "On request"}
              </h3>

              <p className="mt-2 text-sm text-white/60">
                per person
              </p>

              {/* BATCH SELECTION */}
              {availableBatches.length > 0 ? (
                <div className="mt-7">
                  <p className="mb-3 text-sm font-semibold text-white">
                    Select departure
                  </p>

                  <div className="space-y-3">
                    {availableBatches.map((batch) => {
                      const selected = batch.id === selectedBatchId;

                      return (
                        <button
                          key={batch.id}
                          type="button"
                          onClick={() =>
                            setSelectedBatchId(batch.id)
                          }
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-orange-400 bg-orange-400/15"
                              : "border-white/10 bg-white/5 hover:border-white/30"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-white">
                                {formatDate(batch.departureDate)}
                              </p>

                              {batch.returnDate !==
                                batch.departureDate && (
                                <p className="mt-1 text-xs text-white/60">
                                  Returns{" "}
                                  {formatDate(batch.returnDate)}
                                </p>
                              )}
                            </div>

                            <p className="font-bold text-orange-300">
                              {formatPrice(batch.price)}
                            </p>
                          </div>

                          <p className="mt-2 text-xs text-white/60">
                            {Math.max(
                              0,
                              batch.totalSeats - (batch.bookedSeats || 0)
                            )}{" "}
                            seats available
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-white/70">
                  No public departures are currently available.
                  Contact us for upcoming dates.
                </div>
              )}

              {/* TRAVELERS */}
              <div className="mt-6">
                <label className="text-sm font-semibold text-white">
                  Number of travelers
                </label>

                <input
                  type="number"
                  min="1"
                  max={availableSeats ?? undefined}
                  value={booking.travelers}
                  onChange={(event) =>
                    setBooking((current) => ({
                      ...current,
                      travelers: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-orange-400"
                />
              </div>

              {/* TOTAL */}
              {selectedBatch && (
                <div className="mt-5 rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>
                      {formatPrice(selectedBatch.price)} ×{" "}
                      {travelerCount}
                    </span>

                    <span className="text-lg font-bold text-white">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>

                  {selectedBatch.paymentMode === "ADVANCE" && (
                    <p className="mt-2 text-xs text-orange-300">
                      Advance required:{" "}
                      {formatPrice(
                        selectedBatch.advanceAmount *
                          travelerCount
                      )}
                    </p>
                  )}
                </div>
              )}

              {!isEnoughSeats && (
                <p className="mt-3 text-sm font-semibold text-red-300">
                  Only {availableSeats} seats are available for this
                  departure.
                </p>
              )}

              {/* BOOK NOW */}
              <button
                type="button"
                onClick={handleBookNow}
                disabled={
                  !selectedBatch ||
                  !isEnoughSeats ||
                  !selectedBatch.bookingEnabled
                }
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Book Now
              </button>

              {/* WHATSAPP */}
              <a
                href={`https://wa.me/918482846287?text=${encodeURIComponent(
                  `Hi Bucketlist Adventure, I'm interested in ${
                    trip.title
                  }${
                    selectedBatch
                      ? ` for ${formatDate(
                          selectedBatch.departureDate
                        )}`
                      : ""
                  }. We are ${travelerCount} traveler(s). Please share the details.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#17251d]"
              >
                Enquire on WhatsApp
              </a>

              {/* Summary */}
              <div className="mt-6 space-y-3 text-sm text-white/80">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Duration</span>

                  <span className="font-semibold text-white">
                    {displayDuration}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Difficulty</span>

                  <span className="font-semibold text-white">
                    {trip.difficulty}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Seats</span>

                  <span className="font-semibold text-white">
                   {displayAvailableSeats !== null
                   ? `${displayAvailableSeats} available`
                   : trip.seats || "On request"}
                   </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Group size</span>

                  <span className="font-semibold text-white">
                    {trip.groupSize || "Flexible"}
                  </span>
                </div>
              </div>
            </div>

            {/* INCLUDED */}
            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Included
              </p>

              <ul className="space-y-3 text-[#17251d]">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 text-orange-500">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* NOT INCLUDED */}
            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Not included
              </p>

              <ul className="space-y-3 text-[#17251d]">
                {excludes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 text-red-500">–</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WHATSAPP FORM */}
            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Need help?
              </p>

              <p className="mb-5 text-sm leading-6 text-[#5d6862]">
                Not ready to book online? Send us your details and our
                team will help you plan the trip.
              </p>

              <form onSubmit={submitBooking} className="space-y-4">

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Name</span>

                  <input
                    required
                    value={booking.name}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Your full name"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Phone</span>

                  <input
                    required
                    value={booking.phone}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="Your phone number"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Travelers</span>

                  <input
                    type="number"
                    min="1"
                    value={booking.travelers}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        travelers: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Message</span>

                  <textarea
                    value={booking.message}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#17251d] px-5 py-4 text-sm font-semibold text-white transition hover:bg-orange-500"
                >
                  Send enquiry on WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* SIMILAR TRIPS */}
        <div className="mt-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                More adventures
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Similar trips
              </h2>
            </div>

            <Link
              href="/trips"
              className="text-sm font-semibold text-[#17251d] underline decoration-[#17251d]/40 underline-offset-4"
            >
              View all trips
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {defaultTrips
              .filter((item: TripData) => item.slug !== trip.slug)
              .slice(0, 3)
              .map((item: TripData) => {
                const nextBatch = item.batches
  ?.filter(
    (batch) =>
      batch.visibility === "PUBLIC" &&
      batch.status === "OPEN" &&
      batch.bookingEnabled &&
      batch.totalSeats - (batch.bookedSeats || 0) > 0
  )
  .sort(
    (a, b) =>
      new Date(a.departureDate).getTime() -
      new Date(b.departureDate).getTime()
  )[0];

                return (
                  <Link
                    key={item.slug}
                    href={`/trips/${item.slug}`}
                    className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1"
                  >
                    <div
                      className="h-44 bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${item.image}')`,
                      }}
                    />

                    <div className="p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                        {item.startPoint}
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-[#17251d]">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[#5d6862]">
                        {item.summary}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-black/10 pt-4">
                        <span className="font-semibold text-[#17251d]">
                          {nextBatch
                            ? formatPrice(nextBatch.price)
                            : item.price || "On request"}
                        </span>

                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                          View
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </main>
  );
}