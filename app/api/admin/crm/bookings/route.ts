import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Payment = { amount: number | string; status: string; created_at: string };
const paidAmount = (payments: Payment[] = []) => payments
  .filter((payment) => payment.status === "CAPTURED")
  .reduce((total, payment) => total + Number(payment.amount || 0), 0);

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;
  try {
    const [regular, custom] = await Promise.all([
      supabaseAdmin.from("bookings").select("booking_id,customer_name,phone,email,trip_title,departure_date,travelers,total_amount,balance_amount,booking_status,payment_status,created_at,updated_at,payments(amount,status,created_at)").order("updated_at", { ascending: false }).limit(500),
      supabaseAdmin.from("custom_bookings").select("id,booking_reference,customer_name,phone,email,package_name,travel_start_date,travelers,total_amount,amount_paid,balance_amount,booking_status,payment_status,created_at,updated_at,custom_booking_payments(amount,status,created_at)").order("updated_at", { ascending: false }).limit(500),
    ]);
    if (regular.error) throw regular.error;
    if (custom.error) throw custom.error;
    const regularRows = (regular.data || []).map((row) => {
      const payments = (row.payments || []) as Payment[];
      const amountPaid = paidAmount(payments);
      return { id: row.booking_id, type: "TRIP", customerName: row.customer_name, phone: row.phone, email: row.email, tripTitle: row.trip_title, departureDate: row.departure_date, travelers: row.travelers, totalAmount: Number(row.total_amount), amountPaid, balanceAmount: Math.max(0, Number(row.total_amount) - amountPaid), bookingStatus: row.booking_status, paymentStatus: row.payment_status, latestPaymentAt: payments.sort((a,b) => b.created_at.localeCompare(a.created_at))[0]?.created_at || null, updatedAt: row.updated_at };
    });
    const customRows = (custom.data || []).map((row) => {
      const payments = (row.custom_booking_payments || []) as Payment[];
      return { id: row.booking_reference, type: "CUSTOM", customerName: row.customer_name, phone: row.phone, email: row.email, tripTitle: row.package_name, departureDate: row.travel_start_date, travelers: row.travelers, totalAmount: Number(row.total_amount), amountPaid: Number(row.amount_paid), balanceAmount: Number(row.balance_amount), bookingStatus: row.booking_status, paymentStatus: row.payment_status, latestPaymentAt: payments.sort((a,b) => b.created_at.localeCompare(a.created_at))[0]?.created_at || null, updatedAt: row.updated_at };
    });
    return Response.json({ bookings: [...regularRows, ...customRows].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)) }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("GET CRM bookings failed:", error);
    return Response.json({ error: "Unable to load booking and payment summaries." }, { status: 500 });
  }
}
