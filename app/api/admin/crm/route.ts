import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["NEW", "CALLED", "FOLLOW_UP", "INTERESTED", "QUOTATION_SENT", "CONFIRMED", "NOT_INTERESTED", "CLOSED"]);
const PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH"]);
const ACTIVITIES = new Set(["CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE", "FOLLOW_UP"]);

const text = (value: unknown, max = 500) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
const phoneKey = (value: string | null) => value ? value.replace(/[^0-9]/g, "") || null : null;
const emailKey = (value: string | null) => value ? value.trim().toLowerCase() || null : null;

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function findOrCreateCustomer(input: Record<string, unknown>) {
  const fullName = text(input.fullName, 150);
  const phone = text(input.phone, 32);
  const email = text(input.email, 320);
  const normalizedPhone = phoneKey(phone);
  const normalizedEmail = emailKey(email);
  if (!fullName || (!normalizedPhone && !normalizedEmail)) throw new Error("VALIDATION");

  let existing = null;
  if (normalizedPhone) {
    const result = await supabaseAdmin.from("crm_customers").select("*").eq("normalized_phone", normalizedPhone).maybeSingle();
    if (result.error) throw result.error;
    existing = result.data;
  }
  if (!existing && normalizedEmail) {
    const result = await supabaseAdmin.from("crm_customers").select("*").eq("normalized_email", normalizedEmail).limit(1).maybeSingle();
    if (result.error) throw result.error;
    existing = result.data;
  }
  if (existing) {
    const result = await supabaseAdmin.from("crm_customers").update({
      full_name: fullName, phone, normalized_phone: normalizedPhone,
      email, normalized_email: normalizedEmail, city: text(input.city, 120),
      last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", existing.id).select("*").single();
    if (result.error) throw result.error;
    return result.data;
  }
  const result = await supabaseAdmin.from("crm_customers").insert({
    full_name: fullName, phone, normalized_phone: normalizedPhone,
    email, normalized_email: normalizedEmail, city: text(input.city, 120),
  }).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const url = new URL(request.url);
  const view = url.searchParams.get("view") || "leads";
  try {
    if (view === "customers") {
      const search = (url.searchParams.get("search") || "").trim().slice(0, 100);
      let query = supabaseAdmin.from("crm_customers").select("*").order("last_seen_at", { ascending: false }).limit(250);
      if (search) query = query.or(`full_name.ilike.%${search.replace(/[%_,()]/g, "")}%,phone.ilike.%${search.replace(/[%_,()]/g, "")}%,email.ilike.%${search.replace(/[%_,()]/g, "")}%`);
      const result = await query;
      if (result.error) throw result.error;
      const customers = result.data || [];
      const phones = customers.map((item) => item.normalized_phone).filter(Boolean);
      const [regular, custom] = await Promise.all([
        phones.length ? supabaseAdmin.from("bookings").select("booking_id,trip_title,departure_date,phone,travelers,total_amount,payment_status,booking_status").in("phone", phones) : Promise.resolve({ data: [], error: null }),
        phones.length ? supabaseAdmin.from("custom_bookings").select("booking_reference,package_name,travel_start_date,phone,travelers,total_amount,payment_status,booking_status").in("phone", phones) : Promise.resolve({ data: [], error: null }),
      ]);
      if (regular.error) throw regular.error;
      if (custom.error) throw custom.error;
      return Response.json({ customers, bookings: regular.data || [], customBookings: custom.data || [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const result = await supabaseAdmin.from("crm_leads")
      .select("*, customer:crm_customers(*), activities:crm_lead_activities(*)")
      .order("updated_at", { ascending: false }).limit(500);
    if (result.error) throw result.error;
    const leads = result.data || [];
    const now = Date.now();
    return Response.json({
      leads,
      summary: {
        total: leads.length,
        new: leads.filter((lead) => lead.status === "NEW").length,
        due: leads.filter((lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() <= now && !["CONFIRMED", "CLOSED", "NOT_INTERESTED"].includes(lead.status)).length,
        confirmed: leads.filter((lead) => lead.status === "CONFIRMED").length,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/admin/crm failed:", error);
    return Response.json({ error: "Unable to load CRM data. Confirm that the CRM migration has been applied." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const input = await request.json() as Record<string, unknown>;
    const customer = await findOrCreateCustomer(input);
    const status = text(input.status, 40) || "NEW";
    const priority = text(input.priority, 20) || "MEDIUM";
    if (!STATUSES.has(status) || !PRIORITIES.has(priority)) throw new Error("VALIDATION");
    const inserted = await supabaseAdmin.from("crm_leads").insert({
      customer_id: customer.id,
      interested_trip: text(input.interestedTrip, 200), travel_month: text(input.travelMonth, 80),
      source: text(input.source, 100) || "Other", status, priority,
      assigned_to: text(input.assignedTo, 100), next_follow_up_at: text(input.nextFollowUpAt, 40),
      notes: text(input.notes, 3000),
    }).select("*, customer:crm_customers(*)").single();
    if (inserted.error) throw inserted.error;
    await supabaseAdmin.from("crm_lead_activities").insert({ lead_id: inserted.data.id, activity_type: "CREATED", to_status: status, note: text(input.notes, 1000), created_by: text(input.assignedTo, 100) || "Admin" });
    return Response.json({ lead: inserted.data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "VALIDATION") return Response.json({ error: "Enter a valid name, mobile or email, status and priority." }, { status: 400 });
    console.error("POST /api/admin/crm failed:", error);
    return Response.json({ error: "Unable to create the lead." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const input = await request.json() as Record<string, unknown>;
    const leadId = text(input.leadId, 80);
    const status = text(input.status, 40);
    const activityType = text(input.activityType, 40) || "NOTE";
    if (!leadId || (status && !STATUSES.has(status)) || !ACTIVITIES.has(activityType)) throw new Error("VALIDATION");
    const current = await supabaseAdmin.from("crm_leads").select("status").eq("id", leadId).single();
    if (current.error) throw current.error;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (input.nextFollowUpAt !== undefined) updates.next_follow_up_at = text(input.nextFollowUpAt, 40);
    if (input.assignedTo !== undefined) updates.assigned_to = text(input.assignedTo, 100);
    if (["CALL", "WHATSAPP", "EMAIL", "MEETING"].includes(activityType)) updates.last_contacted_at = new Date().toISOString();
    const updated = await supabaseAdmin.from("crm_leads").update(updates).eq("id", leadId).select("*, customer:crm_customers(*), activities:crm_lead_activities(*)").single();
    if (updated.error) throw updated.error;
    const activity = await supabaseAdmin.from("crm_lead_activities").insert({
      lead_id: leadId, activity_type: activityType, from_status: current.data.status,
      to_status: status || current.data.status, note: text(input.note, 1600),
      next_follow_up_at: text(input.nextFollowUpAt, 40), created_by: text(input.createdBy, 100) || "Admin",
    });
    if (activity.error) throw activity.error;
    return Response.json({ lead: updated.data });
  } catch (error) {
    if (error instanceof Error && error.message === "VALIDATION") return Response.json({ error: "Invalid lead update." }, { status: 400 });
    console.error("PATCH /api/admin/crm failed:", error);
    return Response.json({ error: "Unable to update the lead." }, { status: 500 });
  }
}
