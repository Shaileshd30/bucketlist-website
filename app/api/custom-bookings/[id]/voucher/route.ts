import path from "node:path";

import { requireAdmin } from "@/lib/admin-auth";
import {
  createCustomBookingVoucher,
  type CustomBookingVoucherData,
} from "@/lib/custom-booking-voucher";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "Custom booking ID is required." }, { status: 400 });
  }

  try {
    const [bookingResult, installmentsResult, paymentsResult] = await Promise.all([
      supabaseAdmin.from("custom_bookings").select("*").eq("id", id).maybeSingle(),
      supabaseAdmin
        .from("custom_booking_installments")
        .select("*")
        .eq("custom_booking_id", id)
        .order("installment_number", { ascending: true }),
      supabaseAdmin
        .from("custom_booking_payments")
        .select("*")
        .eq("custom_booking_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (bookingResult.error) throw bookingResult.error;
    if (installmentsResult.error) throw installmentsResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (!bookingResult.data) {
      return Response.json({ error: "Custom booking was not found." }, { status: 404 });
    }

    const row = bookingResult.data;
    const voucher: CustomBookingVoucherData = {
      bookingReference: row.booking_reference,
      packageName: row.package_name,
      customerName: row.customer_name,
      phone: row.phone,
      email: row.email,
      travelers: row.travelers,
      travelStartDate: row.travel_start_date,
      travelEndDate: row.travel_end_date,
      bookingStatus: row.booking_status,
      paymentStatus: row.payment_status,
      totalAmount: Number(row.total_amount),
      amountPaid: Number(row.amount_paid),
      balanceAmount: Number(row.balance_amount),
      installments: (installmentsResult.data || []).map((installment) => ({
        label: installment.label,
        amount: Number(installment.amount),
        dueDate: installment.due_date,
        paidAmount: Number(installment.paid_amount),
        status: installment.status,
        paidAt: installment.paid_at,
      })),
      payments: (paymentsResult.data || []).map((payment) => ({
        providerPaymentId: payment.provider_payment_id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.created_at,
      })),
    };

    const pdf = await createCustomBookingVoucher(
      voucher,
      path.join(process.cwd(), "public", "bucketlist-logo.png")
    );
    const filename = `${voucher.bookingReference.replace(/[^a-zA-Z0-9_-]/g, "-")}-voucher.pdf`;

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET custom booking voucher failed:", error);
    return Response.json(
      { error: "Unable to generate the booking voucher." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
