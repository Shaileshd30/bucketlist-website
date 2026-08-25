"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  defaultTrips,
  type TripBatch,
  type TripData,
} from "../data/trips";

type CustomerDetails = {
  name: string;
  phone: string;
  email: string;
};

type AppliedCoupon = {
  code: string;
  discountAmount: number;
};

type CouponResponse = {
  valid: boolean;
  code?: string;
  message: string;
  discountAmount: number;
  finalAmount: number;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number | string;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: string,
    handler: (response: { error?: { description?: string } }) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BookingPageClient() {
  const searchParams = useSearchParams();

  const tripSlug = searchParams.get("trip") || "";
  const batchId = searchParams.get("batch") || "";
  const travelersFromUrl = searchParams.get("travelers") || "1";

  const [trips, setTrips] = useState<TripData[]>(defaultTrips);

  const [travelerCount, setTravelerCount] = useState(
    Math.max(1, Number.parseInt(travelersFromUrl, 10) || 1)
  );

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    phone: "",
    email: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [createdBookingId, setCreatedBookingId] = useState("");

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState<AppliedCoupon | null>(null);

  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const response = await fetch("/api/trips", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setTrips(data);
        }
      } catch {
        // Fall back to defaultTrips.
      }
    };

    loadTrips();
  }, []);

  useEffect(() => {
    void loadRazorpayScript();
  }, []);

  const trip = useMemo(() => {
    return trips.find((item) => item.slug === tripSlug) || null;
  }, [trips, tripSlug]);

  const batch: TripBatch | null = useMemo(() => {
    if (!trip?.batches) {
      return null;
    }

    return trip.batches.find((item) => item.id === batchId) || null;
  }, [trip, batchId]);

  const availableSeats = batch
    ? Math.max(0, batch.totalSeats - batch.bookedSeats)
    : 0;

  const validTravelerCount = Math.max(
    1,
    Math.min(travelerCount, availableSeats || 1)
  );

  // Original trip amount before coupon
  const originalAmount = batch
    ? batch.price * validTravelerCount
    : 0;

  const discountAmount = appliedCoupon?.discountAmount || 0;

  // Final amount after coupon
  const finalAmount = Math.max(
    0,
    originalAmount - discountAmount
  );

  // Calculate payment after discount.
  const normalAdvanceAmount = batch
    ? batch.advanceAmount * validTravelerCount
    : 0;

  const amountToPay = batch
    ? batch.paymentMode === "ADVANCE"
      ? Math.min(normalAdvanceAmount, finalAmount)
      : finalAmount
    : 0;

  const balanceAmount = Math.max(
    0,
    finalAmount - amountToPay
  );

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const formatDate = (date: string) => {
    if (!date) {
      return "Date not available";
    }

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isCustomerValid =
    customer.name.trim().length > 1 &&
    customer.phone.replace(/\D/g, "").length >= 10 &&
    customer.email.includes("@");

  const canContinue =
    Boolean(trip) &&
    Boolean(batch) &&
    batch?.bookingEnabled === true &&
    batch?.status === "OPEN" &&
    availableSeats >= validTravelerCount &&
    availableSeats > 0 &&
    isCustomerValid &&
    acceptedTerms;

  const handleApplyCoupon = async () => {
    if (!trip || !batch) {
      return;
    }

    const normalizedCode = couponCode.trim().toUpperCase();

    setCouponMessage("");
    setCouponError("");

    if (!normalizedCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setIsApplyingCoupon(true);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          code: normalizedCode,
          tripSlug: trip.slug,
          bookingAmount: originalAmount,
        }),
      });

      const data = (await response.json()) as CouponResponse;

      if (!response.ok || !data.valid) {
        setAppliedCoupon(null);

        setCouponError(
          data.message || "This coupon could not be applied."
        );

        return;
      }

      setAppliedCoupon({
        code: data.code || normalizedCode,
        discountAmount: data.discountAmount,
      });

      setCouponCode(data.code || normalizedCode);

      setCouponMessage(
        data.message ||
          `Coupon ${data.code || normalizedCode} applied successfully.`
      );
    } catch {
      setAppliedCoupon(null);

      setCouponError(
        "Unable to validate the coupon right now. Please try again."
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
  };

  /*
   * If traveler quantity changes after a coupon has been applied,
   * remove it. The customer must apply it again because eligibility
   * and discount may depend on the booking amount.
   */
  useEffect(() => {
    if (!appliedCoupon) {
      return;
    }

    setAppliedCoupon(null);
    setCouponMessage("");
    setCouponError(
      "Traveler count changed. Please apply your coupon again."
    );

    // We intentionally react only to traveler count changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validTravelerCount]);

  const verifyPayment = async (
    bookingId: string,
    payment: RazorpaySuccessResponse
  ) => {
    const response = await fetch("/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.ok) {
      throw new Error(
        data?.error || "Payment verification failed. Please contact us."
      );
    }

    setPaymentConfirmed(true);
    setPaymentError("");
  };

  const openRazorpayCheckout = async (bookingId: string) => {
    setIsProcessingPayment(true);
    setPaymentError("");

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Razorpay Checkout could not be loaded. Please check your internet connection and try again."
        );
      }

      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      const orderData = await orderResponse.json();

      if (
        !orderResponse.ok ||
        !orderData?.ok ||
        !orderData?.order?.id ||
        !orderData?.keyId
      ) {
        throw new Error(
          orderData?.error || "Unable to start payment. Please try again."
        );
      }

      const options: RazorpayCheckoutOptions = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency || "INR",
        name: "Bucketlist Adventure",
        description: `${trip?.title || "Trip"} booking`,
        order_id: orderData.order.id,
        prefill: {
          name: customer.name.trim(),
          email: customer.email.trim(),
          contact: customer.phone.trim(),
        },
        notes: {
          bookingId,
          tripSlug: trip?.slug || "",
          batchId: batch?.id || "",
        },
        theme: {
          color: "#17251d",
        },
        handler: async (paymentResponse) => {
          setIsProcessingPayment(true);
          setPaymentError("");

          try {
            await verifyPayment(bookingId, paymentResponse);
          } catch (error) {
            setPaymentError(
              error instanceof Error
                ? error.message
                : "Payment verification failed. Please contact us with your booking ID."
            );
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            setPaymentError(
              "Payment window was closed. Your booking is still pending and you can retry payment."
            );
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setIsProcessingPayment(false);
        setPaymentError(
          response.error?.description ||
            "Payment failed. Please retry using another payment method."
        );
      });

      razorpay.open();
      setIsProcessingPayment(false);
    } catch (error) {
      setIsProcessingPayment(false);
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to start Razorpay Checkout. Please try again."
      );
    }
  };

  const handleContinue = async () => {
    if (
      !trip ||
      !batch ||
      !canContinue ||
      isCreatingBooking ||
      isProcessingPayment
    ) {
      return;
    }

    setBookingError("");
    setPaymentError("");

    if (createdBookingId) {
      await openRazorpayCheckout(createdBookingId);
      return;
    }

    setIsCreatingBooking(true);

    try {
      const bookingPayload = {
        tripId: trip.id,
        tripSlug: trip.slug,
        batchId: batch.id,
        customerName: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email.trim(),
        travelers: validTravelerCount,
        couponCode: appliedCoupon?.code || undefined,
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (!response.ok || !data?.booking?.bookingId) {
        throw new Error(
          data?.error || "Unable to create your booking."
        );
      }

      const bookingId = data.booking.bookingId;
      setCreatedBookingId(bookingId);
      await openRazorpayCheckout(bookingId);
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "Unable to create your booking. Please try again."
      );
    } finally {
      setIsCreatingBooking(false);
    }
  };

  if (!trip || !batch) {
    return (
      <main className="min-h-screen bg-[#f5f3ee] px-6 py-16 text-[#17251d]">
        <div className="mx-auto max-w-xl rounded-[28px] border border-black/10 bg-white p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
            Booking
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Booking details not found
          </h1>

          <p className="mt-4 text-[#5d6862]">
            Please return to the trip page and select an available
            departure.
          </p>

          <Link
            href="/trips"
            className="mt-6 inline-flex rounded-full bg-[#17251d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            View trips
          </Link>
        </div>
      </main>
    );
  }

  const bookingUnavailable =
    !batch.bookingEnabled ||
    batch.status !== "OPEN" ||
    availableSeats <= 0;

  return (
    <main className="min-h-screen bg-[#f5f3ee] px-6 py-12 text-[#17251d] lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/trips/${trip.slug}`}
          className="mb-8 inline-flex items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-[#17251d] hover:text-white"
        >
          ← Back to trip
        </Link>

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
            Direct booking
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {trip.title}
          </h1>

          <p className="mt-3 text-[#5d6862]">
            {formatDate(batch.departureDate)}

            {batch.returnDate &&
            batch.returnDate !== batch.departureDate
              ? ` – ${formatDate(batch.returnDate)}`
              : ""}
          </p>
        </div>

        {bookingUnavailable && (
          <div className="mb-8 rounded-[24px] border border-orange-200 bg-orange-50 p-5">
            <p className="font-semibold text-[#17251d]">
              Online booking is currently unavailable for this
              departure.
            </p>

            <p className="mt-1 text-sm text-[#5d6862]">
              Please return to the trip page or contact Bucketlist
              Adventure for assistance.
            </p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div className="space-y-6">

            {/* Customer details */}
            <div className="rounded-[28px] border border-black/10 bg-white p-6 lg:p-8">
              <p className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Your details
              </p>

              <div className="space-y-4">
                <label className="block space-y-2 text-sm font-medium">
                  <span>Full name *</span>

                  <input
                    value={customer.name}
                    onChange={(event) =>
                      setCustomer((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Your full name"
                    autoComplete="name"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium">
                  <span>Mobile number *</span>

                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(event) =>
                      setCustomer((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="10-digit mobile number"
                    autoComplete="tel"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium">
                  <span>Email *</span>

                  <input
                    type="email"
                    value={customer.email}
                    onChange={(event) =>
                      setCustomer((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>
              </div>
            </div>

            {/* Travelers */}
            <div className="rounded-[28px] border border-black/10 bg-white p-6 lg:p-8">
              <p className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Travelers
              </p>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f5f2] p-4">
                <div>
                  <p className="font-semibold">
                    Number of travelers
                  </p>

                  <p className="mt-1 text-sm text-[#5d6862]">
                    {availableSeats} seats currently available
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={
                      bookingUnavailable ||
                      validTravelerCount <= 1
                    }
                    onClick={() =>
                      setTravelerCount((current) =>
                        Math.max(1, current - 1)
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>

                  <span className="min-w-8 text-center text-xl font-bold">
                    {validTravelerCount}
                  </span>

                  <button
                    type="button"
                    disabled={
                      bookingUnavailable ||
                      validTravelerCount >= availableSeats
                    }
                    onClick={() =>
                      setTravelerCount((current) =>
                        Math.min(
                          availableSeats,
                          current + 1
                        )
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="rounded-[28px] border border-black/10 bg-white p-6 lg:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Coupon code
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Have a discount code?
              </h2>

              <p className="mt-2 text-sm text-[#5d6862]">
                Enter your Bucketlist Adventure coupon below.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  value={couponCode}
                  disabled={Boolean(appliedCoupon)}
                  onChange={(event) => {
                    setCouponCode(
                      event.target.value.toUpperCase()
                    );

                    setCouponError("");
                    setCouponMessage("");
                  }}
                  placeholder="Enter coupon code"
                  className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 font-semibold uppercase tracking-[0.08em] outline-none transition focus:border-orange-400 disabled:opacity-60"
                />

                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="rounded-2xl border border-[#17251d]/15 px-5 py-3 text-sm font-bold transition hover:bg-[#17251d] hover:text-white"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={
                      isApplyingCoupon ||
                      !couponCode.trim() ||
                      bookingUnavailable
                    }
                    className="rounded-2xl bg-[#17251d] px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isApplyingCoupon
                      ? "Applying..."
                      : "Apply"}
                  </button>
                )}
              </div>

              {couponMessage && appliedCoupon && (
                <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm">
                  <p className="font-semibold text-green-700">
                    ✓ {couponMessage}
                  </p>

                  <p className="mt-1 text-green-700">
                    You saved{" "}
                    <strong>
                      {formatPrice(discountAmount)}
                    </strong>
                    .
                  </p>
                </div>
              )}

              {couponError && (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
                  {couponError}
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 rounded-[24px] border border-black/10 bg-white p-5 text-sm">
              <input
                type="checkbox"
                checked={acceptedTerms}
                disabled={bookingUnavailable}
                onChange={(event) =>
                  setAcceptedTerms(event.target.checked)
                }
                className="mt-1 h-5 w-5 accent-orange-500"
              />

              <span>
                I confirm that the booking details are correct and I
                agree to Bucketlist Adventure&apos;s booking and
                cancellation terms.
              </span>
            </label>
          </div>

          {/* Booking summary */}
          <aside className="h-fit rounded-[28px] bg-[#17251d] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.08)] lg:sticky lg:top-6 lg:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
              Booking summary
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              {trip.title}
            </h2>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">
                  Departure
                </span>

                <span className="text-right font-semibold">
                  {formatDate(batch.departureDate)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">
                  Travelers
                </span>

                <span className="font-semibold">
                  {validTravelerCount}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">
                  Price / person
                </span>

                <span className="font-semibold">
                  {formatPrice(batch.price)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">
                  Trip total
                </span>

                <span
                  className={
                    appliedCoupon
                      ? "font-semibold text-white/60 line-through"
                      : "font-semibold"
                  }
                >
                  {formatPrice(originalAmount)}
                </span>
              </div>

              {appliedCoupon && (
                <>
                  <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                    <span className="text-white/65">
                      Coupon ({appliedCoupon.code})
                    </span>

                    <span className="font-semibold text-green-300">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                    <span className="font-semibold">
                      Final trip total
                    </span>

                    <span className="font-bold text-white">
                      {formatPrice(finalAmount)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/65">
                  Payment
                </span>

                <span className="font-semibold">
                  {batch.paymentMode === "ADVANCE"
                    ? "Advance"
                    : "Full payment"}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="font-semibold">
                  Pay now
                </span>

                <span className="text-lg font-bold text-orange-300">
                  {formatPrice(amountToPay)}
                </span>
              </div>

              {batch.paymentMode === "ADVANCE" && (
                <div className="flex justify-between gap-4">
                  <span className="text-white/65">
                    Balance later
                  </span>

                  <span className="font-semibold">
                    {formatPrice(balanceAmount)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={
                !canContinue ||
                isCreatingBooking ||
                isProcessingPayment ||
                paymentConfirmed
              }
              onClick={handleContinue}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {paymentConfirmed
                ? "Payment Confirmed"
                : isCreatingBooking
                  ? "Creating Booking..."
                  : isProcessingPayment
                    ? "Starting Payment..."
                    : createdBookingId
                      ? "Retry Payment"
                      : "Continue to Payment"}
            </button>

            {bookingError && (
              <div className="mt-4 rounded-2xl bg-red-500/15 p-4 text-sm text-red-200">
                <p className="font-semibold">Booking could not be created</p>
                <p className="mt-1">{bookingError}</p>
              </div>
            )}

            {paymentError && !paymentConfirmed && (
              <div className="mt-4 rounded-2xl bg-amber-500/15 p-4 text-sm text-amber-100">
                <p className="font-semibold">Payment pending</p>
                <p className="mt-1">{paymentError}</p>
                {createdBookingId && (
                  <p className="mt-2 text-xs text-white/70">
                    Booking ID: {createdBookingId}
                  </p>
                )}
              </div>
            )}

            {createdBookingId && !paymentConfirmed && (
              <div className="mt-4 rounded-2xl bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                  Pending Booking
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {createdBookingId}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Complete the Razorpay payment to confirm your seats.
                </p>
              </div>
            )}

            {paymentConfirmed && (
              <div className="mt-4 rounded-2xl bg-green-500/15 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-300">
                  Payment Successful
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  Booking Confirmed
                </p>
                <p className="mt-2 text-sm text-white/80">
                  Booking ID: <strong>{createdBookingId}</strong>
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Your payment has been verified and your seats are confirmed.
                </p>
              </div>
            )}

            {!bookingUnavailable &&
              !acceptedTerms && (
                <p className="mt-3 text-center text-xs text-white/50">
                  Complete your details and accept the terms
                  to continue.
                </p>
              )}

            {bookingUnavailable && (
              <p className="mt-3 text-center text-xs text-white/50">
                This departure is not currently available
                for online booking.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}