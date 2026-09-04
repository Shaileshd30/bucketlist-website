import crypto from "crypto";
import Razorpay from "razorpay";

import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type VerifyPaymentRequest = {
  bookingId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

type BookingRow = {
  id: string;
  booking_id: string;
  amount_payable_now: number | string;
  payment_status: string;
  booking_status: string;
};

type PaymentRow = {
  id: number | string;
  booking_id: string;
  provider: string;
  provider_order_id: string;
  status: string;
};

type ConfirmationResult = {
  ok: boolean;
  alreadyConfirmed?: boolean;
  manualReview?: boolean;
  reason?: string;

  bookingId?: string;
  tripTitle?: string;

  travelers?: number;
  amountPaid?: number | string;

  paymentStatus?: string;
  bookingStatus?: string;

  totalSeats?: number;
  bookedSeats?: number;
  availableSeats?: number;
  requestedSeats?: number;
};

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  const receivedBuffer = Buffer.from(
    signature,
    "utf8"
  );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

export async function POST(
  request: Request
) {
  try {
    /*
     * ---------------------------------------------
     * 1. READ REQUEST
     * ---------------------------------------------
     */

    let body: VerifyPaymentRequest;

try {
  const parsedBody: unknown =
    await request.json();

  if (
    parsedBody === null ||
    typeof parsedBody !== "object" ||
    Array.isArray(parsedBody)
  ) {
    return Response.json(
      {
        error:
          "Invalid JSON request body.",
      },
      {
        status: 400,
      }
    );
  }

  body =
    parsedBody as VerifyPaymentRequest;
} catch {
  return Response.json(
    {
      error:
        "Invalid JSON request body.",
    },
    {
      status: 400,
    }
  );
}

    const bookingId =
      body.bookingId?.trim();

    const razorpayOrderId =
      body.razorpay_order_id?.trim();

    const razorpayPaymentId =
      body.razorpay_payment_id?.trim();

    const razorpaySignature =
      body.razorpay_signature?.trim();

    if (
      !bookingId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return Response.json(
        {
          error:
            "Payment verification details are missing.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ---------------------------------------------
     * 2. LOAD RAZORPAY CREDENTIALS
     * ---------------------------------------------
     */

    const keyId =
      process.env.RAZORPAY_KEY_ID;

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error(
        "Razorpay environment variables are missing."
      );

      return Response.json(
        {
          error:
            "Payment gateway is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ---------------------------------------------
     * 3. LOAD BOOKING FROM SUPABASE
     * ---------------------------------------------
     */

    const {
      data: bookingData,
      error: bookingError,
    } = await supabaseAdmin
      .from("bookings")
      .select(
        `
          id,
          booking_id,
          amount_payable_now,
          payment_status,
          booking_status
        `
      )
      .eq(
        "booking_id",
        bookingId
      )
      .maybeSingle();

    if (bookingError) {
      throw bookingError;
    }

    if (!bookingData) {
      return Response.json(
        {
          error:
            "Booking could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const booking =
      bookingData as BookingRow;

    /*
     * ---------------------------------------------
     * 4. IDEMPOTENT RESPONSE
     * ---------------------------------------------
     */

    if (
      booking.payment_status === "PAID" &&
      booking.booking_status === "CONFIRMED"
    ) {
      return Response.json({
        ok: true,
        alreadyVerified: true,

        booking: {
          bookingId:
            booking.booking_id,

          paymentStatus:
            booking.payment_status,

          bookingStatus:
            booking.booking_status,
        },
      });
    }

    /*
     * ---------------------------------------------
     * 5. LOAD THE SERVER-STORED PAYMENT ORDER
     * ---------------------------------------------
     *
     * We do not trust an arbitrary Razorpay order
     * ID supplied by the browser.
     */

    const {
      data: paymentData,
      error: paymentError,
    } = await supabaseAdmin
      .from("payments")
      .select(
        `
          id,
          booking_id,
          provider,
          provider_order_id,
          status
        `
      )
      .eq(
        "booking_id",
        bookingId
      )
      .eq(
        "provider",
        "RAZORPAY"
      )
      .eq(
        "provider_order_id",
        razorpayOrderId
      )
      .maybeSingle();

    if (paymentError) {
      throw paymentError;
    }

    if (!paymentData) {
      return Response.json(
        {
          error:
            "No matching Razorpay order is associated with this booking.",
        },
        {
          status: 409,
        }
      );
    }

    const payment =
      paymentData as PaymentRow;

    /*
     * Extra order check.
     */

    if (
      payment.provider_order_id !==
      razorpayOrderId
    ) {
      return Response.json(
        {
          error:
            "Payment order does not match this booking.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ---------------------------------------------
     * 6. VERIFY RAZORPAY SIGNATURE
     * ---------------------------------------------
     */

    const signatureValid =
      verifySignature(
        payment.provider_order_id,
        razorpayPaymentId,
        razorpaySignature,
        keySecret
      );

    if (!signatureValid) {
      return Response.json(
        {
          error:
            "Payment signature verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ---------------------------------------------
     * 7. FETCH PAYMENT FROM RAZORPAY
     * ---------------------------------------------
     *
     * This confirms the actual Razorpay-side
     * payment state instead of trusting only the
     * browser callback.
     */

    const razorpay =
      new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

    const razorpayPayment =
      await razorpay.payments.fetch(
        razorpayPaymentId
      );

    /*
     * ---------------------------------------------
     * 8. VERIFY ORDER RELATIONSHIP
     * ---------------------------------------------
     */

    if (
      razorpayPayment.order_id !==
      razorpayOrderId
    ) {
      return Response.json(
        {
          error:
            "Razorpay payment does not belong to this order.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ---------------------------------------------
     * 9. VERIFY AMOUNT
     * ---------------------------------------------
     */

    const expectedAmountInPaise =
      Math.round(
        Number(
          booking.amount_payable_now
        ) * 100
      );

    const actualAmountInPaise =
      Number(
        razorpayPayment.amount
      );

    if (
      !Number.isFinite(
        expectedAmountInPaise
      ) ||
      actualAmountInPaise !==
        expectedAmountInPaise
    ) {
      return Response.json(
        {
          error:
            "Payment amount does not match the booking amount.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ---------------------------------------------
     * 10. VERIFY CURRENCY
     * ---------------------------------------------
     */

    if (
      razorpayPayment.currency !==
      "INR"
    ) {
      return Response.json(
        {
          error:
            "Unexpected payment currency.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ---------------------------------------------
     * 11. REQUIRE CAPTURED PAYMENT
     * ---------------------------------------------
     */

    if (
      razorpayPayment.status !==
      "captured"
    ) {
      /*
       * Record the Razorpay state, but DO NOT
       * confirm the booking or reserve seats.
       */

      const {
        error: updateError,
      } = await supabaseAdmin
        .from("payments")
        .update({
          provider_payment_id:
            razorpayPaymentId,

          provider_signature:
            razorpaySignature,

          status:
            String(
              razorpayPayment.status
            ).toUpperCase(),

          provider_response:
            razorpayPayment,
        })
        .eq(
          "id",
          payment.id
        );

      if (updateError) {
        throw updateError;
      }

      return Response.json(
        {
          error:
            `Payment is currently ${razorpayPayment.status}. Booking has not yet been confirmed.`,

          paymentStatus:
            razorpayPayment.status,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ---------------------------------------------
     * 12. ATOMIC SUPABASE CONFIRMATION
     * ---------------------------------------------
     *
     * This ONE database transaction:
     *
     * - locks the booking
     * - locks the payment
     * - locks the departure
     * - rechecks seat availability
     * - reserves seats
     * - increments coupon usage
     * - marks payment captured
     * - confirms booking
     */

    const {
      data: confirmationData,
      error: confirmationError,
    } = await supabaseAdmin.rpc(
      "confirm_paid_booking",
      {
        p_booking_id:
          bookingId,

        p_provider_order_id:
          razorpayOrderId,

        p_provider_payment_id:
          razorpayPaymentId,

        p_provider_signature:
          razorpaySignature,

        p_provider_response:
          razorpayPayment,
      }
    );

    if (confirmationError) {
      console.error(
        "confirm_paid_booking failed:",
        confirmationError
      );

      throw confirmationError;
    }

    const confirmation =
      confirmationData as ConfirmationResult;

    /*
     * ---------------------------------------------
     * 13. MANUAL REVIEW
     * ---------------------------------------------
     *
     * Payment was captured but another booking
     * consumed the seats first.
     */

    if (
  confirmation.manualReview
) {
  let manualReviewMessage =
    "Payment was received, but the booking requires manual review. Our team will assist you.";

  if (
    confirmation.reason ===
    "INSUFFICIENT_SEATS"
  ) {
    manualReviewMessage =
      "Payment was received, but the requested seats are no longer available. Manual review is required.";
  }

  if (
    confirmation.reason ===
    "COUPON_USAGE_LIMIT_REACHED"
  ) {
    manualReviewMessage =
      "Payment was received, but the coupon reached its usage limit while your payment was being completed. Our team will review your booking.";
  }

  if (
    confirmation.reason ===
    "COUPON_NOT_FOUND"
  ) {
    manualReviewMessage =
      "Payment was received, but the coupon applied to this booking could no longer be verified. Our team will review your booking.";
  }

  return Response.json(
    {
      error:
        manualReviewMessage,

      manualReview: true,

      reason:
        confirmation.reason,

      bookingId,

      availability: {
        totalSeats:
          confirmation.totalSeats,

        bookedSeats:
          confirmation.bookedSeats,

        availableSeats:
          confirmation.availableSeats,

        requestedSeats:
          confirmation.requestedSeats,
      },
    },
    {
      status: 409,
    }
  );
}

    /*
     * ---------------------------------------------
     * 14. SUCCESS
     * ---------------------------------------------
     */

    return Response.json({
      ok: true,

      alreadyVerified:
        confirmation.alreadyConfirmed ??
        false,

      booking: {
        bookingId:
          confirmation.bookingId ??
          bookingId,

        tripTitle:
          confirmation.tripTitle,

        travelers:
          confirmation.travelers,

        amountPaid:
          confirmation.amountPaid,

        paymentStatus:
          confirmation.paymentStatus ??
          "PAID",

        bookingStatus:
          confirmation.bookingStatus ??
          "CONFIRMED",
      },

      payment: {
        orderId:
          razorpayOrderId,

        paymentId:
          razorpayPaymentId,

        status:
          razorpayPayment.status,

        verified: true,
      },

      availability: {
        totalSeats:
          confirmation.totalSeats,

        bookedSeats:
          confirmation.bookedSeats,

        availableSeats:
          confirmation.availableSeats,
      },
    });
    } catch (error) {
    console.error(
      "POST /api/payments/verify failed:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to verify payment right now.",
      },
      {
        status: 500,
      }
    );
  }
}