import { supabaseAdmin } from "@/lib/supabase-server";

type RazorpayPaymentEntity = {
  id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  captured?: boolean;
};

type RazorpayPaymentLinkEntity = {
  id?: string;
  status?: string;
};

type PaymentLinkWebhookPayload = {
  event?: string;

  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };

    payment_link?: {
      entity?: RazorpayPaymentLinkEntity;
    };
  };
};

type CustomBookingLookupRow = {
  id: string;
  booking_reference: string;
  advance_amount: number | string;
  amount_paid: number | string;
};

export async function
processCustomBookingPaymentLinkWebhook(
  webhookPayload: unknown
): Promise<Response | null> {
  const payload =
    webhookPayload as
      PaymentLinkWebhookPayload;

  if (
    payload.event !==
    "payment_link.paid"
  ) {
    return null;
  }

  const payment =
    payload.payload
      ?.payment
      ?.entity;

  const paymentLink =
    payload.payload
      ?.payment_link
      ?.entity;

  if (
    !payment?.id ||
    !paymentLink?.id ||
    typeof payment.amount !==
      "number" ||
    !payment.currency
  ) {
    console.error(
      "payment_link.paid webhook is missing required data."
    );

    return Response.json(
      {
        error:
          "Invalid payment-link payload.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  if (
    payment.status !==
      "captured" ||
    payment.captured !== true
  ) {
    console.error(
      "payment_link.paid contains a non-captured payment:",
      payment.id
    );

    return Response.json({
      ok: true,
      ignored: true,
      reason:
        "PAYMENT_NOT_CAPTURED",
    });
  }

  const {
    data,
    error: lookupError,
  } = await supabaseAdmin
    .from("custom_bookings")
    .select(
      `
        id,
        booking_reference,
        advance_amount,
        amount_paid
      `
    )
    .eq(
      "razorpay_payment_link_id",
      paymentLink.id
    )
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  const booking =
    data as
      CustomBookingLookupRow | null;

  /*
   * Return 200 for a valid Razorpay event
   * that does not belong to this system.
   */
  if (!booking) {
    console.error(
      "Webhook received for an unknown custom payment link:",
      paymentLink.id
    );

    return Response.json({
      ok: true,
      ignored: true,
      reason:
        "CUSTOM_PAYMENT_LINK_NOT_FOUND",
    });
  }

    /*
   * Razorpay may deliver the same event
   * repeatedly. Detect an already-recorded
   * payment before recalculating the amount due.
   */
  const {
    data: existingPayment,
    error: existingPaymentError,
  } = await supabaseAdmin
    .from(
      "custom_booking_payments"
    )
    .select(
      "id, custom_booking_id"
    )
    .eq(
      "provider_payment_id",
      payment.id
    )
    .maybeSingle();

  if (existingPaymentError) {
    throw existingPaymentError;
  }

  if (existingPayment) {
    if (
      existingPayment.custom_booking_id !==
      booking.id
    ) {
      console.error(
        "Razorpay payment ID belongs to another custom booking:",
        payment.id
      );

      return Response.json({
        ok: true,
        manualReview: true,
        reason:
          "CUSTOM_PAYMENT_BOOKING_MISMATCH",
      });
    }

    return Response.json({
      ok: true,
      event:
        payload.event,
      idempotent: true,
      customBookingId:
        booking.id,
    });
  }

  const expectedAmountInPaise =
    Math.round(
      (
        Number(
          booking.advance_amount
        ) -
        Number(
          booking.amount_paid
        )
      ) * 100
    );

  if (
    payment.amount !==
    expectedAmountInPaise
  ) {
    console.error(
      "Custom booking payment amount mismatch:",
      booking.booking_reference
    );

    const {
      error: reviewError,
    } = await supabaseAdmin
      .from("custom_bookings")
      .update({
        booking_status:
          "MANUAL_REVIEW",
      })
      .eq(
        "id",
        booking.id
      );

    if (reviewError) {
      throw reviewError;
    }

    return Response.json({
      ok: true,
      manualReview: true,
      reason:
        "CUSTOM_PAYMENT_AMOUNT_MISMATCH",
    });
  }

  if (
    payment.currency.toUpperCase() !==
    "INR"
  ) {
    console.error(
      "Custom booking payment currency mismatch:",
      booking.booking_reference
    );

    const {
      error: reviewError,
    } = await supabaseAdmin
      .from("custom_bookings")
      .update({
        booking_status:
          "MANUAL_REVIEW",
      })
      .eq(
        "id",
        booking.id
      );

    if (reviewError) {
      throw reviewError;
    }

    return Response.json({
      ok: true,
      manualReview: true,
      reason:
        "CUSTOM_PAYMENT_CURRENCY_MISMATCH",
    });
  }

  const {
    data: confirmationData,
    error: confirmationError,
  } = await supabaseAdmin.rpc(
    "confirm_custom_booking_payment",
    {
      p_custom_booking_id:
        booking.id,

      p_provider_payment_link_id:
        paymentLink.id,

      p_provider_payment_id:
        payment.id,

      p_amount:
        payment.amount / 100,

      p_currency:
        payment.currency.toUpperCase(),

      p_provider_response:
        payload,
    }
  );

  if (confirmationError) {
    console.error(
      "Custom booking payment confirmation failed:",
      confirmationError
    );

    /*
     * A non-2xx response asks Razorpay
     * to retry the signed webhook.
     */
    return Response.json(
      {
        error:
          "Unable to confirm custom booking.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  return Response.json({
    ok: true,
    event:
      payload.event,
    customBooking:
      confirmationData,
  });
}