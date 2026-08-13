"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { defaultTrips, type TripData } from "../../data/trips";

type BookingFormState = {
  name: string;
  phone: string;
  date: string;
  travelers: string;
  message: string;
};

export function TripPageClient({ trip }: { trip: TripData }) {
  const [selectedImage, setSelectedImage] = useState<string>(trip.image || "");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [booking, setBooking] = useState<BookingFormState>({
    name: "",
    phone: "",
    date: "",
    travelers: "2",
    message: `I'm interested in ${trip.title}. Please share the available dates and details.`,
  });

  useEffect(() => {
    const gallery = trip.gallery && trip.gallery.length > 0 ? trip.gallery : [trip.image].filter(Boolean);
    setSelectedImage((current) => (current && gallery.includes(current) ? current : gallery[0] || trip.image || ""));
  }, [trip]);

  const gallery = useMemo(() => {
    const items = trip.gallery && trip.gallery.length > 0 ? trip.gallery : [trip.image].filter(Boolean);
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

  const submitBooking = (event: React.FormEvent) => {
    event.preventDefault();

    const message = [
      `Hi Bucketlist Adventure,`,
      `I am interested in ${trip.title}.`,
      booking.name ? `Name: ${booking.name}` : "",
      booking.phone ? `Phone: ${booking.phone}` : "",
      booking.date ? `Preferred date: ${booking.date}` : "",
      booking.travelers ? `Travelers: ${booking.travelers}` : "",
      booking.message ? `Message: ${booking.message}` : "",
      "Please share the available slot and next steps.",
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/918482846287?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#17251d]">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
        >
          ← Back to home
        </Link>

        <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div
              className="min-h-[380px] bg-cover bg-center"
              style={{ backgroundImage: `url('${primaryImage || trip.image}')` }}
            />

            <div className="p-8 lg:p-10">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                {trip.startPoint}
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{trip.title}</h1>
              <p className="mt-3 text-lg text-[#5d6862]">{trip.subtitle}</p>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-[#17251d]">
                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">Price</p>
                  <p className="mt-2 font-semibold">{trip.price}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">Duration</p>
                  <p className="mt-2 font-semibold">{trip.duration}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">Seats</p>
                  <p className="mt-2 font-semibold">{trip.seats}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">Difficulty</p>
                  <p className="mt-2 font-semibold">{trip.difficulty}</p>
                </div>
              </div>

              <a
                href="https://wa.me/918482846287"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#17251d] px-6 py-4 text-sm font-semibold text-white transition hover:bg-orange-500"
              >
                {trip.cta}
              </a>
            </div>
          </div>
        </div>

        {gallery.length > 0 && (
          <div className="mt-10 rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Photo gallery</p>
              <span className="text-sm text-[#5d6862]">{gallery.length} images</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_0.7fr]">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="overflow-hidden rounded-[24px] border border-black/10 bg-[#f7f5f2] text-left"
              >
                <div
                  className="h-[420px] w-full bg-cover bg-center transition duration-300 hover:scale-[1.01]"
                  style={{ backgroundImage: `url('${primaryImage}')` }}
                />
              </button>

              <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-[18px] border transition ${
                      primaryImage === image ? "border-orange-500 ring-2 ring-orange-200" : "border-black/10"
                    }`}
                  >
                    <div
                      className="h-28 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url('${image}')` }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
              <div className="h-[75vh] w-full bg-cover bg-center" style={{ backgroundImage: `url('${primaryImage}')` }} />
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Overview</p>
              <p className="text-lg leading-8 text-[#5d6862] whitespace-pre-line">{overview}</p>

              <div className="mt-10">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Itinerary</p>
                <ol className="space-y-4">
                  {itinerary.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-4 rounded-2xl bg-[#f7f5f2] p-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17251d] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="text-[#17251d]">{item}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {pickupPoints.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Pickup Points</p>
                <ul className="space-y-2 text-[#17251d]">
                  {pickupPoints.map((item, index) => (
                    <li key={`${item}-${index}`} className="rounded-2xl bg-[#f7f5f2] p-3">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {thingsToCarry.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Things to Carry</p>
                <ul className="space-y-2 text-[#17251d]">
                  {thingsToCarry.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2 rounded-2xl bg-[#f7f5f2] p-3">
                      <span className="mt-1 text-orange-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {medicalDisclaimer.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Medical Disclaimer</p>
                <ul className="space-y-2 text-[#17251d]">
                  {medicalDisclaimer.map((item, index) => (
                    <li key={`${item}-${index}`} className="rounded-2xl bg-[#f7f5f2] p-3">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {rules.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Rules</p>
                <ul className="space-y-2 text-[#17251d]">
                  {rules.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2 rounded-2xl bg-[#f7f5f2] p-3">
                      <span className="mt-1 text-red-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="sticky top-6 rounded-[28px] border border-black/10 bg-[#17251d] p-8 text-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-300">Starting from</p>
              <h3 className="text-4xl font-bold">{trip.price}</h3>
              <div className="mt-5 space-y-3 text-sm text-white/80">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Duration</span>
                  <span className="font-semibold text-white">{trip.duration}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Difficulty</span>
                  <span className="font-semibold text-white">{trip.difficulty}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Seats</span>
                  <span className="font-semibold text-white">{trip.seats}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Group size</span>
                  <span className="font-semibold text-white">{trip.groupSize}</span>
                </div>
              </div>

              <a
                href="#booking-form"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-4 text-sm font-semibold text-[#17251d] transition hover:bg-orange-300"
              >
                {trip.cta}
              </a>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Included</p>
              <ul className="space-y-3 text-[#17251d]">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 text-orange-500">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Not included</p>
              <ul className="space-y-3 text-[#17251d]">
                {excludes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 text-red-500">–</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div id="booking-form" className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">Book this trip</p>
              <form onSubmit={submitBooking} className="space-y-4">
                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Name</span>
                  <input
                    value={booking.name}
                    onChange={(event) => setBooking((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Your full name"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Phone</span>
                  <input
                    value={booking.phone}
                    onChange={(event) => setBooking((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="Your phone number"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                    <span>Date</span>
                    <input
                      type="date"
                      value={booking.date}
                      onChange={(event) => setBooking((current) => ({ ...current, date: event.target.value }))}
                      className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                    />
                  </label>

                  <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                    <span>Travelers</span>
                    <input
                      value={booking.travelers}
                      onChange={(event) => setBooking((current) => ({ ...current, travelers: event.target.value }))}
                      placeholder="2"
                      className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                    />
                  </label>
                </div>

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Message</span>
                  <textarea
                    value={booking.message}
                    onChange={(event) => setBooking((current) => ({ ...current, message: event.target.value }))}
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

        <div className="mt-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">More adventures</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Similar trips</h2>
            </div>
            <Link href="/trips" className="text-sm font-semibold text-[#17251d] underline decoration-[#17251d]/40 underline-offset-4">
              View all trips
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {defaultTrips
              .filter((item: TripData) => item.slug !== trip.slug)
              .slice(0, 3)
              .map((item: TripData) => (
                <Link
                  key={item.slug}
                  href={`/trips/${item.slug}`}
                  className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1"
                >
                  <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">{item.startPoint}</p>
                    <h3 className="mt-2 text-2xl font-bold text-[#17251d]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#5d6862]">{item.summary}</p>
                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-black/10 pt-4">
                      <span className="font-semibold text-[#17251d]">{item.price}</span>
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">View</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}
