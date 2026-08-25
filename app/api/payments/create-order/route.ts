import Razorpay from "razorpay";

import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type CreatePaymentOrderRequest = {
  bookingId?: string;
};

type BookingRow = {
  id: string;
  booking_id: string;

  trip_id: string;
  trip_slug: string;
  trip_title: string;

  batch_id: string;

  customer_name: string;
  phone: string;
  email: string;

  amount_payable_now:
    | number
    | string;

  payment_status: string;
  booking_status: string;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as CreatePaymentOrderRequest;

    const bookingId =
      body.bookingId?.trim();

    if (!bookingId) {
      return Response.json(
        {
          error:
            "Booking ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------
     * 1. RAZORPAY CREDENTIALS
     * --------------------------------
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
     * --------------------------------
     * 2. LOAD BOOKING FROM SUPABASE
     * --------------------------------
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
          trip_id,
          trip_slug,
          trip_title,
          batch_id,
          customer_name,
          phone,
          email,
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
     * --------------------------------
     * 3. BOOKING MUST STILL BE PENDING
     * --------------------------------
     */

    if (
      booking.booking_status !==
      "PENDING"
    ) {
      return Response.json(
        {
          error:
            "This booking is not awaiting payment.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      booking.payment_status ===
      "PAID"
    ) {
      return Response.json(
        {
          error:
            "This booking has already been paid.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * --------------------------------
     * 4. GET SERVER-SIDE PAYMENT AMOUNT
     * --------------------------------
     *
     * Never accept the amount from the browser.
     */

    const amountInRupees =
      Number(
        booking.amount_payable_now
      );

    if (
      !Number.isFinite(
        amountInRupees
      ) ||
      amountInRupees <= 0
    ) {
      return Response.json(
        {
          error:
            "Invalid payable amount.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Razorpay expects INR in paise.
     *
     * ₹1,350 = 135000
     */
    const amountInPaise =
      Math.round(
        amountInRupees * 100
      );

    /*
     * --------------------------------
     * 5. CREATE RAZORPAY ORDER
     * --------------------------------
     */

    const razorpay =
      new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

    const order =
      await razorpay.orders.create({
        amount:
          amountInPaise,

        currency:
          "INR",

        receipt:
          booking.booking_id,

        notes: {
          bookingId:
            booking.booking_id,

          trip:
            booking.trip_title,

          batchId:
            booking.batch_id,

          customerName:
            booking.customer_name,
        },
      });

    /*
     * --------------------------------
     * 6. STORE PAYMENT ATTEMPT
     * --------------------------------
     *
     * We now use the payments table rather
     * than adding Razorpay data to bookings.json.
     */

    const {
      error:
        paymentInsertError,
    } = await supabaseAdmin
      .from("payments")
      .insert({
        booking_id:
          booking.booking_id,

        provider:
          "RAZORPAY",

        provider_order_id:
          order.id,

        provider_payment_id:
          null,

        provider_signature:
          null,

        amount:
          amountInRupees,

        currency:
          "INR",

        status:
          "CREATED",

        payment_type:
          "BOOKING",

        provider_response: {
          orderId:
            order.id,

          amount:
            order.amount,

          currency:
            order.currency,

          receipt:
            order.receipt,

          status:
            order.status,
        },
      });

    if (
      paymentInsertError
    ) {
      console.error(
        "Unable to save Razorpay order:",
        paymentInsertError
      );

      return Response.json(
        {
          error:
            "Payment order was created but could not be recorded. Please try again.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * --------------------------------
     * 7. RETURN CHECKOUT DATA
     * --------------------------------
     *
     * keyId is safe for Razorpay Checkout.
     * keySecret is NEVER returned.
     */

    return Response.json(
      {
        ok: true,

        order: {
          id:
            order.id,

          amount:
            order.amount,

          currency:
            order.currency,

          receipt:
            order.receipt,

          status:
            order.status,
        },

        booking: {
          bookingId:
            booking.booking_id,

          tripTitle:
            booking.trip_title,

          customerName:
            booking.customer_name,

          phone:
            booking.phone,

          email:
            booking.email,

          amountPayableNow:
            amountInRupees,
        },

        keyId,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "POST /api/payments/create-order failed:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create payment order.",
      },
      {
        status: 500,
      }
    );
  }
}