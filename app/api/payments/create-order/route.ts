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

type PaymentRow = {
  provider_order_id: string | null;
  amount: number | string;
  currency: string;
  status: string;
  created_at: string;
};

const REUSABLE_ORDER_MINUTES = 15;

function isRecentPaymentAttempt(
  createdAt: string
) {
  const createdTime =
    new Date(
      createdAt
    ).getTime();

  if (
    !Number.isFinite(
      createdTime
    )
  ) {
    return false;
  }

  const ageMs =
    Date.now() -
    createdTime;

  return (
    ageMs >= 0 &&
    ageMs <=
      REUSABLE_ORDER_MINUTES *
        60 *
        1000
  );
}

export async function POST(
  request: Request
) {
  try {
    let body: CreatePaymentOrderRequest;

    try {
      body =
        (await request.json()) as CreatePaymentOrderRequest;
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

    const razorpay =
      new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

    /*
     * --------------------------------
     * 5. REUSE A RECENT CREATED ORDER
     * --------------------------------
     *
     * A repeated browser request should not
     * create another Razorpay order when a
     * valid recent payment attempt already
     * exists for this booking.
     *
     * We still verify the order with Razorpay
     * before returning it.
     */

    const {
      data:
        existingPaymentData,
      error:
        existingPaymentError,
    } = await supabaseAdmin
      .from("payments")
      .select(
        `
          provider_order_id,
          amount,
          currency,
          status,
          created_at
        `
      )
      .eq(
        "booking_id",
        booking.booking_id
      )
      .eq(
        "provider",
        "RAZORPAY"
      )
      .eq(
        "payment_type",
        "BOOKING"
      )
      .eq(
        "status",
        "CREATED"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (
      existingPaymentError
    ) {
      throw existingPaymentError;
    }

    const existingPayment =
      existingPaymentData as
        | PaymentRow
        | null;

    if (
      existingPayment &&
      existingPayment.provider_order_id &&
      Number(
        existingPayment.amount
      ) ===
        amountInRupees &&
      existingPayment.currency ===
        "INR" &&
      isRecentPaymentAttempt(
        existingPayment.created_at
      )
    ) {
      try {
        const existingOrder =
          await razorpay.orders.fetch(
            existingPayment.provider_order_id
          );

        const existingOrderAmount =
          Number(
            existingOrder.amount
          );

        const existingOrderCurrency =
          String(
            existingOrder.currency ||
              ""
          ).toUpperCase();

        const existingOrderStatus =
          String(
            existingOrder.status ||
              ""
          ).toLowerCase();

        const orderStillUsable =
          existingOrderAmount ===
            amountInPaise &&
          existingOrderCurrency ===
            "INR" &&
          existingOrderStatus ===
            "created";

        if (
          orderStillUsable
        ) {
          return Response.json(
            {
              ok: true,

              reused:
                true,

              order: {
                id:
                  existingOrder.id,

                amount:
                  existingOrder.amount,

                currency:
                  existingOrder.currency,

                receipt:
                  existingOrder.receipt,

                status:
                  existingOrder.status,
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
        }
      } catch (error) {
        /*
         * If Razorpay cannot fetch/reuse the
         * old order, continue below and create
         * a fresh order. We do not change the
         * old payment record here because the
         * existing verification/webhook flow
         * owns payment-state transitions.
         */
        console.error(
          "Unable to reuse existing Razorpay order:",
          error
        );
      }
    }

    /*
     * --------------------------------
     * 6. CREATE RAZORPAY ORDER
     * --------------------------------
     */

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
     * 7. STORE PAYMENT ATTEMPT
     * --------------------------------
     *
     * We use the payments table rather
     * than adding Razorpay data to bookings.
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
     * 8. RETURN CHECKOUT DATA
     * --------------------------------
     *
     * keyId is safe for Razorpay Checkout.
     * keySecret is NEVER returned.
     */

    return Response.json(
      {
        ok: true,

        reused:
          false,

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
