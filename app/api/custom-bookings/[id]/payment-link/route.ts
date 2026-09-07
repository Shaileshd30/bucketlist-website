import Razorpay from "razorpay";

import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type CustomBookingRow = {
    id: string;
    booking_reference: string;
    package_name: string;
    customer_name: string;
    phone: string;
    email: string | null;
    advance_amount: number | string;
    amount_paid: number | string;
    booking_status: string;
    payment_status: string;
    razorpay_payment_link_id: string | null;
    razorpay_payment_link_url: string | null;
};

type RazorpayPaymentLinkResult = {
    id: string;
    short_url: string;
    status: string;
};

export async function POST(
    _request: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    const authError =
        await requireAdmin();

    if (authError) {
        return authError;
    }

    try {
        const {
            id,
        } = await context.params;

        if (!id) {
            return Response.json(
                {
                    error:
                        "Custom booking ID is required.",
                },
                {
                    status: 400,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        const {
            data,
            error: bookingError,
        } = await supabaseAdmin
            .from("custom_bookings")
            .select(
                `
          id,
          booking_reference,
          package_name,
          customer_name,
          phone,
          email,
          advance_amount,
          amount_paid,
          booking_status,
          payment_status,
          razorpay_payment_link_id,
          razorpay_payment_link_url
        `
            )
            .eq("id", id)
            .maybeSingle();

        if (bookingError) {
            throw bookingError;
        }

        const booking =
            data as CustomBookingRow | null;

        if (!booking) {
            return Response.json(
                {
                    error:
                        "Custom booking was not found.",
                },
                {
                    status: 404,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        if (
            booking.booking_status === "CANCELLED" ||
            booking.booking_status === "COMPLETED"
        ) {
            return Response.json(
                {
                    error:
                        "A payment link cannot be created for this booking.",
                },
                {
                    status: 409,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        /*
         * Reuse the stored link. This prevents an
         * accidental double-click from creating
         * multiple payment links for one booking.
         */
        if (
            booking.razorpay_payment_link_id &&
            booking.razorpay_payment_link_url
        ) {
            return Response.json(
                {
                    paymentLink: {
                        id:
                            booking.razorpay_payment_link_id,

                        url:
                            booking.razorpay_payment_link_url,

                        reused: true,
                    },
                },
                {
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        const keyId =
            process.env.RAZORPAY_KEY_ID;

        const keySecret =
            process.env.RAZORPAY_KEY_SECRET;

        if (
            !keyId ||
            !keySecret
        ) {
            console.error(
                "Razorpay credentials are missing."
            );

            return Response.json(
                {
                    error:
                        "Razorpay is not configured.",
                },
                {
                    status: 500,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        const advanceAmount =
            Number(
                booking.advance_amount
            );

        const amountPaid =
            Number(
                booking.amount_paid
            );

        const amountToCollect =
            advanceAmount - amountPaid;

        if (
            !Number.isFinite(amountToCollect) ||
            amountToCollect <= 0
        ) {
            return Response.json(
                {
                    error:
                        "No advance payment is currently due.",
                },
                {
                    status: 409,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        const amountInPaise =
            Math.round(
                amountToCollect * 100
            );

        const razorpay =
            new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });

        const paymentLink =
            await razorpay.paymentLink.create({
                amount: amountInPaise,
                currency: "INR",

                accept_partial: false,

                description:
                    `Advance payment for ${booking.package_name}`,

                reference_id:
                    booking.booking_reference,

                customer: {
                    name:
                        booking.customer_name,

                    contact:
                        booking.phone,

                    ...(booking.email
                        ? {
                            email:
                                booking.email,
                        }
                        : {}),
                },

                notify: {
                    sms: false,
                    email: false,
                },

                reminder_enable: true,

                notes: {
                    custom_booking_id:
                        booking.id,

                    booking_reference:
                        booking.booking_reference,

                    payment_purpose:
                        "CUSTOM_BOOKING_ADVANCE",
                },
            }) as RazorpayPaymentLinkResult;

        if (
            !paymentLink.id ||
            !paymentLink.short_url
        ) {
            throw new Error(
                "Razorpay returned an incomplete payment link."
            );
        }

        const {
            error: updateError,
        } = await supabaseAdmin
            .from("custom_bookings")
            .update({
                razorpay_payment_link_id:
                    paymentLink.id,

                razorpay_payment_link_url:
                    paymentLink.short_url,

                payment_link_expires_at:
                    null,

                booking_status:
                    "AWAITING_ADVANCE",

                payment_status:
                    "LINK_CREATED",
            })
            .eq("id", booking.id);

        if (updateError) {
            throw updateError;
        }

        return Response.json(
            {
                paymentLink: {
                    id:
                        paymentLink.id,

                    url:
                        paymentLink.short_url,

                    status:
                        paymentLink.status,

                    amount:
                        amountToCollect,

                    currency:
                        "INR",

                    reused:
                        false,
                },
            },
            {
                status: 201,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error(
            "POST custom booking payment link failed:",
            error
        );

        return Response.json(
            {
                error:
                    "Unable to create the payment link.",
            },
            {
                status: 500,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    }
}