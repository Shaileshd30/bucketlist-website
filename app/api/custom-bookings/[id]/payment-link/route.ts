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
    total_amount: number | string;
    amount_paid: number | string;
    booking_status: string;
    payment_status: string;
    razorpay_payment_link_id: string | null;
    razorpay_payment_link_url: string | null;
};

type CustomInstallmentRow = {
    id: string;
    installment_number: number;
    label: string;
    amount: number | string;
    paid_amount: number | string;
    status: string;
    razorpay_payment_link_id: string | null;
    razorpay_payment_link_url: string | null;
};

type RazorpayPaymentLinkResult = {
    id: string;
    short_url: string;
    status: string;
};

export async function POST(
    request: Request,
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

        let requestedInstallmentId = "";

        try {
            const raw = await request.text();
            if (raw) {
                const body = JSON.parse(raw) as { installmentId?: unknown };
                if (typeof body.installmentId !== "string") throw new Error();
                requestedInstallmentId = body.installmentId.trim();
            }
        } catch {
            return Response.json(
                { error: "A valid installment is required." },
                { status: 400, headers: { "Cache-Control": "no-store" } }
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
          total_amount,
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

        const { data: installmentData, error: installmentError } =
            await supabaseAdmin
                .from("custom_booking_installments")
                .select("*")
                .eq("custom_booking_id", booking.id)
                .order("installment_number", { ascending: true });

        if (installmentError) throw installmentError;

        const installments = (installmentData || []) as CustomInstallmentRow[];
        const installment = requestedInstallmentId
            ? installments.find((item) => item.id === requestedInstallmentId)
            : installments.find((item) => item.status !== "PAID" && item.status !== "CANCELLED");

        if (!installment) {
            return Response.json(
                {
                    error: "The requested installment is unavailable or already paid.",
                },
                {
                    status: 409,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        if (installment.status === "PAID" || installment.status === "CANCELLED") {
            return Response.json(
                { error: "A payment link cannot be created for this installment." },
                { status: 409, headers: { "Cache-Control": "no-store" } }
            );
        }

        if (installment.razorpay_payment_link_id && installment.razorpay_payment_link_url) {
            return Response.json(
                {
                    paymentLink: {
                        id: installment.razorpay_payment_link_id,
                        url: installment.razorpay_payment_link_url,
                        installmentId: installment.id,
                        reused: true,
                    },
                },
                { headers: { "Cache-Control": "no-store" } }
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

        const amountToCollect =
            Number(installment.amount) - Number(installment.paid_amount);

        if (
            !Number.isFinite(amountToCollect) ||
            amountToCollect <= 0
        ) {
            return Response.json(
                {
                    error:
                        "No payment is currently due for this installment.",
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
                    `${installment.label} for ${booking.package_name}`,

                reference_id:
                    `${booking.booking_reference}-I${installment.installment_number}`,

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

                    installment_id:
                        installment.id,

                    installment_number:
                        String(installment.installment_number),

                    booking_reference:
                        booking.booking_reference,

                    payment_purpose:
                        "CUSTOM_BOOKING_INSTALLMENT",
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

        const { error: updateError } = await supabaseAdmin
            .from("custom_booking_installments")
            .update({
                razorpay_payment_link_id:
                    paymentLink.id,

                razorpay_payment_link_url:
                    paymentLink.short_url,

                payment_link_expires_at:
                    null,

            })
            .eq("id", installment.id)
            .eq("custom_booking_id", booking.id);

        if (updateError) {
            throw updateError;
        }

        if (Number(booking.amount_paid) === 0) {
            const { error: bookingUpdateError } = await supabaseAdmin
                .from("custom_bookings")
                .update({
                    booking_status: "AWAITING_ADVANCE",
                    payment_status: "LINK_CREATED",
                })
                .eq("id", booking.id);

            if (bookingUpdateError) throw bookingUpdateError;
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

                    installmentId:
                        installment.id,

                    installmentNumber:
                        installment.installment_number,

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
