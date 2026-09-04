import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type RazorpayPaymentEntity = {
  id: string;
  order_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
};

type RazorpayWebhookPayload = {
  event?: string;
  created_at?: number;

  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
};

function verifyWebhookSignature(
  rawBody: string,
  receivedSignature: string,
  secret: string
) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  const receivedBuffer = Buffer.from(
    receivedSignature,
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
     * IMPORTANT:
     * Read RAW body before JSON.parse().
     */
    const rawBody =
      await request.text();

    const signature =
      request.headers.get(
        "x-razorpay-signature"
      );

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is missing."
      );

      return Response.json(
        {
          error:
            "Webhook is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (!signature) {
      return Response.json(
        {
          error:
            "Webhook signature is missing.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Verify Razorpay signature BEFORE
     * parsing or trusting the payload.
     */
    const signatureValid =
      verifyWebhookSignature(
        rawBody,
        signature,
        webhookSecret
      );

    if (!signatureValid) {
      console.error(
        "Invalid Razorpay webhook signature."
      );

      return Response.json(
        {
          error:
            "Invalid webhook signature.",
        },
        {
          status: 400,
        }
      );
    }

    const payload =
      JSON.parse(
        rawBody
      ) as RazorpayWebhookPayload;

    /*
     * For now we only need payment.captured.
     *
     * Other Razorpay events should simply
     * receive HTTP 200.
     */
    if (
      payload.event !==
      "payment.captured"
    ) {
      return Response.json({
        ok: true,
        ignored: true,
        event:
          payload.event || null,
      });
    }

    const payment =
      payload.payload
        ?.payment
        ?.entity;

    if (
      !payment ||
      !payment.id ||
      !payment.order_id
    ) {
      console.error(
        "payment.captured webhook missing payment/order data."
      );

      return Response.json(
        {
          error:
            "Invalid payment payload.",
        },
        {
          status: 400,
        }
      );
    }
    if (
  payment.status !== "captured" ||
  payment.captured !== true
) {
  console.error(
    "payment.captured webhook contains a non-captured payment:",
    payment.id
  );

  return Response.json({
    ok: true,
    ignored: true,
    reason:
      "PAYMENT_NOT_CAPTURED",
  });
}

    /*
     * Find the payment attempt we created
     * when Razorpay Checkout was opened.
     */
    const {
      data:
        storedPayment,
      error:
        paymentLookupError,
    } = await supabaseAdmin
      .from("payments")
      .select(
        `
          id,
          booking_id,
          provider_order_id,
          amount,
          currency,
          status
        `
      )
      .eq(
        "provider",
        "RAZORPAY"
      )
      .eq(
        "provider_order_id",
        payment.order_id
      )
      .maybeSingle();

    if (paymentLookupError) {
      throw paymentLookupError;
    }

    /*
     * Return 200 rather than encouraging
     * endless webhook retries for an order
     * that doesn't belong to our system.
     */
    if (!storedPayment) {
      console.error(
        "Webhook received for unknown Razorpay order:",
        payment.order_id
      );

      return Response.json({
        ok: true,
        ignored: true,
        reason:
          "ORDER_NOT_FOUND",
      });
    }

    /*
     * Verify amount and currency against
     * our server-created payment record.
     */
    const expectedAmountInPaise =
      Math.round(
        Number(
          storedPayment.amount
        ) * 100
      );

    if (
      Number(payment.amount) !==
      expectedAmountInPaise
    ) {
      console.error(
        "Webhook amount mismatch:",
        payment.order_id
      );

      return Response.json({
        ok: true,
        manualReview: true,
        reason:
          "AMOUNT_MISMATCH",
      });
    }

    if (
      payment.currency !==
      storedPayment.currency
    ) {
      console.error(
        "Webhook currency mismatch:",
        payment.order_id
      );

      return Response.json({
        ok: true,
        manualReview: true,
        reason:
          "CURRENCY_MISMATCH",
      });
    }

    /*
     * Call the SAME atomic PostgreSQL
     * transaction used by /verify.
     *
     * The webhook itself has already been
     * authenticated using the webhook secret,
     * so we store a marker rather than a
     * Checkout signature.
     */
    const {
      data:
        confirmationData,
      error:
        confirmationError,
    } = await supabaseAdmin.rpc(
      "confirm_paid_booking",
      {
        p_booking_id:
          storedPayment.booking_id,

        p_provider_order_id:
          payment.order_id,

        p_provider_payment_id:
          payment.id,

        p_provider_signature:
          "WEBHOOK_VERIFIED",

        p_provider_response:
          payload,
      }
    );

    if (confirmationError) {
      console.error(
        "Webhook booking confirmation failed:",
        confirmationError
      );

      /*
       * Non-2xx causes Razorpay to retry.
       */
      return Response.json(
        {
          error:
            "Unable to confirm booking.",
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      ok: true,

      event:
        payload.event,

      bookingId:
        storedPayment.booking_id,

      confirmation:
        confirmationData,
    });
  } catch (error) {
    console.error(
      "POST /api/payments/webhook failed:",
      error
    );

    return Response.json(
      {
        error:
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}