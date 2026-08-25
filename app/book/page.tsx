import { Suspense } from "react";
import BookingPageClient from "./BookingPageClient";

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f3ee] px-6 py-16 text-[#17251d]">
          <div className="mx-auto max-w-xl rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
              Booking
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Loading booking details...
            </h1>

            <p className="mt-3 text-sm text-[#5d6862]">
              Please wait while we prepare your booking.
            </p>
          </div>
        </main>
      }
    >
      <BookingPageClient />
    </Suspense>
  );
}