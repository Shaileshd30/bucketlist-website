"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  CreateCustomBookingInput,
  CustomBooking,
} from "@/app/data/custom-bookings";

type FormState = {
  packageName: string;
  customerName: string;
  phone: string;
  email: string;
  travelStartDate: string;
  travelEndDate: string;
  travelers: string;
  totalAmount: string;
  advanceAmount: string;
  balanceDueDate: string;
  notes: string;
};

const initialForm: FormState = {
  packageName: "",
  customerName: "",
  phone: "",
  email: "",
  travelStartDate: "",
  travelEndDate: "",
  travelers: "1",
  totalAmount: "",
  advanceAmount: "",
  balanceDueDate: "",
  notes: "",
};

function formatCurrency(
  amount: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(`${value}T00:00:00`)
  );
}

async function readError(
  response: Response
) {
  try {
    const body =
      (await response.json()) as {
        error?: string;
      };

    return (
      body.error ||
      "Something went wrong."
    );
  } catch {
    return "Something went wrong.";
  }
}

export default function CustomBookingManager() {
  const [
    bookings,
    setBookings,
  ] = useState<CustomBooking[]>([]);

  const [
    form,
    setForm,
  ] = useState<FormState>(
    initialForm
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    generatingFor,
    setGeneratingFor,
  ] = useState<string | null>(
    null
  );

  const [
    message,
    setMessage,
  ] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadBookings =
    useCallback(
      async () => {
        setIsLoading(true);

        try {
          const response =
            await fetch(
              "/api/custom-bookings",
              {
                cache: "no-store",
              }
            );

          if (!response.ok) {
            throw new Error(
              await readError(
                response
              )
            );
          }

          const body =
            (await response.json()) as {
              bookings:
                CustomBooking[];
            };

          setBookings(
            body.bookings || []
          );
        } catch (error) {
          setMessage({
            type: "error",
            text:
              error instanceof Error
                ? error.message
                : "Unable to load custom bookings.",
          });
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

  useEffect(() => {
  const controller =
    new AbortController();

  async function loadInitialBookings() {
    try {
      const response =
        await fetch(
          "/api/custom-bookings",
          {
            cache: "no-store",
            signal:
              controller.signal,
          }
        );

      if (!response.ok) {
        throw new Error(
          await readError(
            response
          )
        );
      }

      const body =
        (await response.json()) as {
          bookings:
            CustomBooking[];
        };

      if (
        !controller.signal.aborted
      ) {
        setBookings(
          body.bookings || []
        );
      }
    } catch (error) {
      if (
        controller.signal.aborted
      ) {
        return;
      }

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to load custom bookings.",
      });
    } finally {
      if (
        !controller.signal.aborted
      ) {
        setIsLoading(false);
      }
    }
  }

  void loadInitialBookings();

  return () => {
    controller.abort();
  };
}, []);

  const updateField = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage(null);
  };

  const createBooking =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();
      setMessage(null);

      const payload:
        CreateCustomBookingInput = {
          packageName:
            form.packageName.trim(),

          customerName:
            form.customerName.trim(),

          phone:
            form.phone.trim(),

          email:
            form.email.trim(),

          travelers:
            Number(
              form.travelers
            ),

          totalAmount:
            Number(
              form.totalAmount
            ),

          advanceAmount:
            Number(
              form.advanceAmount
            ),

          ...(form.travelStartDate
            ? {
                travelStartDate:
                  form.travelStartDate,
              }
            : {}),

          ...(form.travelEndDate
            ? {
                travelEndDate:
                  form.travelEndDate,
              }
            : {}),

          ...(form.balanceDueDate
            ? {
                balanceDueDate:
                  form.balanceDueDate,
              }
            : {}),

          ...(form.notes.trim()
            ? {
                notes:
                  form.notes.trim(),
              }
            : {}),
        };

      setIsSaving(true);

      try {
        const response =
          await fetch(
            "/api/custom-bookings",
            {
              method: "POST",

              headers: {
                "content-type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        if (!response.ok) {
          throw new Error(
            await readError(
              response
            )
          );
        }

        setForm(initialForm);

        setMessage({
          type: "success",
          text:
            "Custom booking created successfully.",
        });

        await loadBookings();
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Unable to create the booking.",
        });
      } finally {
        setIsSaving(false);
      }
    };

  const generatePaymentLink =
    async (
      booking: CustomBooking
    ) => {
      setGeneratingFor(
        booking.id
      );

      setMessage(null);

      try {
        const response =
          await fetch(
            `/api/custom-bookings/${booking.id}/payment-link`,
            {
              method: "POST",
            }
          );

        if (!response.ok) {
          throw new Error(
            await readError(
              response
            )
          );
        }

        const body =
          (await response.json()) as {
            paymentLink: {
              url: string;
              reused?: boolean;
            };
          };

        setMessage({
          type: "success",
          text:
            body.paymentLink.reused
              ? "Existing payment link retrieved."
              : "Payment link created successfully.",
        });

        await loadBookings();
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Unable to create the payment link.",
        });
      } finally {
        setGeneratingFor(
          null
        );
      }
    };

  const copyPaymentLink =
    async (
      link: string
    ) => {
      try {
        await navigator.clipboard.writeText(
          link
        );

        setMessage({
          type: "success",
          text:
            "Payment link copied.",
        });
      } catch {
        setMessage({
          type: "error",
          text:
            "Unable to copy the payment link.",
        });
      }
    };

  const shareOnWhatsApp = (
    booking: CustomBooking
  ) => {
    if (
      !booking.razorpayPaymentLinkUrl
    ) {
      return;
    }

    const phone =
      booking.phone.replace(
        /\D/g,
        ""
      );

    const messageText = [
      `Hello ${booking.customerName},`,
      "",
      `Your advance payment link for ${booking.packageName} is ready.`,
      "",
      `Booking reference: ${booking.bookingReference}`,
      `Advance amount: ${formatCurrency(booking.advanceAmount)}`,
      "",
      booking.razorpayPaymentLinkUrl,
      "",
      "Bucketlist Adventure",
      "We Plan It. You Live It.",
    ].join("\n");

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)] lg:p-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
            Custom travel
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-[#17251d]">
            Create a custom booking
          </h2>

          <p className="mt-2 text-sm text-[#66736c]">
            Record the package and advance
            amount before generating a secure
            Razorpay payment link.
          </p>
        </div>

        {message ? (
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
              message.type ===
              "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <form
          onSubmit={
            createBooking
          }
          className="grid gap-5 md:grid-cols-2"
        >
          <label className="space-y-2 text-sm font-medium text-[#17251d] md:col-span-2">
            <span>
              Package name
            </span>

            <input
              required
              value={
                form.packageName
              }
              onChange={(
                event
              ) =>
                updateField(
                  "packageName",
                  event.target.value
                )
              }
              placeholder="Example: Kashmir customized tour"
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d]">
            <span>
              Customer name
            </span>

            <input
              required
              value={
                form.customerName
              }
              onChange={(
                event
              ) =>
                updateField(
                  "customerName",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d]">
            <span>
              WhatsApp number
            </span>

            <input
              required
              type="tel"
              value={form.phone}
              onChange={(
                event
              ) =>
                updateField(
                  "phone",
                  event.target.value
                )
              }
              placeholder="+91..."
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d]">
            <span>
              Email
            </span>

            <input
              required
              type="email"
              value={form.email}
              onChange={(
                event
              ) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d]">
            <span>
              Travellers
            </span>

            <input
              required
              type="number"
              min="1"
              max="200"
              value={
                form.travelers
              }
              onChange={(
                event
              ) =>
                updateField(
                  "travelers",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d]">
            <span>
              Travel start date
            </span>

            <input
              type="date"
              value={
                form.travelStartDate
              }
              onChange={(
                event
              ) =>
                updateField(
                  "travelStartDate",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d]">
            <span>
              Travel end date
            </span>

            <input
              type="date"
              min={
                form.travelStartDate ||
                undefined
              }
              value={
                form.travelEndDate
              }
              onChange={(
                event
              ) =>
                updateField(
                  "travelEndDate",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d]">
            <span>
              Total package amount
            </span>

            <input
              required
              type="number"
              min="1"
              step="1"
              value={
                form.totalAmount
              }
              onChange={(
                event
              ) =>
                updateField(
                  "totalAmount",
                  event.target.value
                )
              }
              placeholder="₹"
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d]">
            <span>
              Advance amount
            </span>

            <input
              required
              type="number"
              min="1"
              step="1"
              max={
                form.totalAmount ||
                undefined
              }
              value={
                form.advanceAmount
              }
              onChange={(
                event
              ) =>
                updateField(
                  "advanceAmount",
                  event.target.value
                )
              }
              placeholder="₹"
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d]">
            <span>
              Balance due date
            </span>

            <input
              type="date"
              max={
                form.travelStartDate ||
                undefined
              }
              value={
                form.balanceDueDate
              }
              onChange={(
                event
              ) =>
                updateField(
                  "balanceDueDate",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-[#17251d] md:col-span-2">
            <span>
              Internal notes
            </span>

            <textarea
              rows={4}
              value={form.notes}
              onChange={(
                event
              ) =>
                updateField(
                  "notes",
                  event.target.value
                )
              }
              className="w-full resize-y rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-[#17251d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Creating..."
                : "Create custom booking"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)] lg:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
              Booking records
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-[#17251d]">
              Custom bookings
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadBookings()
            }
            disabled={isLoading}
            className="rounded-full border border-[#17251d]/15 px-4 py-2 text-xs font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-[#66736c]">
            Loading custom
            bookings...
          </p>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl bg-[#f7f5f2] p-6 text-sm text-[#66736c]">
            No custom bookings have
            been created yet.
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map(
              (booking) => (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-black/10 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">
                        {
                          booking.bookingReference
                        }
                      </p>

                      <h3 className="mt-2 text-xl font-semibold text-[#17251d]">
                        {
                          booking.packageName
                        }
                      </h3>

                      <p className="mt-1 text-sm text-[#66736c]">
                        {
                          booking.customerName
                        }{" "}
                        · {booking.phone}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#17251d]/8 px-3 py-1 text-[11px] font-bold text-[#17251d]">
                        {
                          booking.bookingStatus
                        }
                      </span>

                      <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700">
                        {
                          booking.paymentStatus
                        }
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-2xl bg-[#f7f5f2] p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-[#77837c]">
                        Travel
                      </p>

                      <p className="mt-1 font-semibold text-[#17251d]">
                        {formatDate(
                          booking.travelStartDate
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#77837c]">
                        Travellers
                      </p>

                      <p className="mt-1 font-semibold text-[#17251d]">
                        {
                          booking.travelers
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#77837c]">
                        Total
                      </p>

                      <p className="mt-1 font-semibold text-[#17251d]">
                        {formatCurrency(
                          booking.totalAmount
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#77837c]">
                        Advance
                      </p>

                      <p className="mt-1 font-semibold text-[#17251d]">
                        {formatCurrency(
                          booking.advanceAmount
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {!booking.razorpayPaymentLinkUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          void generatePaymentLink(
                            booking
                          )
                        }
                        disabled={
                          generatingFor ===
                          booking.id
                        }
                        className="rounded-full bg-[#17251d] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-500 disabled:opacity-60"
                      >
                        {generatingFor ===
                        booking.id
                          ? "Generating..."
                          : "Generate payment link"}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void copyPaymentLink(
                              booking.razorpayPaymentLinkUrl!
                            )
                          }
                          className="rounded-full border border-[#17251d]/15 px-5 py-2.5 text-xs font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
                        >
                          Copy payment link
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            shareOnWhatsApp(
                              booking
                            )
                          }
                          className="rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-semibold text-white transition hover:brightness-95"
                        >
                          Share on WhatsApp
                        </button>
                      </>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}