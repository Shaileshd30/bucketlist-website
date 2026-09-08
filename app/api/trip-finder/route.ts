import { supabaseAdmin } from "@/lib/supabase-server";
import { indiaDate, matchTrips, parseFilters, type FinderTrip, type FinderBatch } from "@/lib/trip-finder";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  let filters;
  try { filters = parseFilters(new URL(request.url).searchParams); }
  catch { return Response.json({ error: "Please check your trip preferences." }, { status: 400, headers }); }
  try {
    // Page through the catalogue so Supabase's default row limit cannot silently hide trips.
    const trips: FinderTrip[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabaseAdmin.from("trips")
        .select("id,slug,title,archived,travel_category,destination,difficulty,start_point,duration_days,summary,includes,not_includes")
        .eq("archived", false).order("id").range(offset, offset + 499).abortSignal(AbortSignal.timeout(10000));
      if (error) throw error;
      trips.push(...(data || []) as FinderTrip[]);
      if (!data || data.length < 500) break;
      if (offset >= 9500) throw new Error("Catalogue limit reached");
    }
    const batches: FinderBatch[] = [];
    for (let offset = 0; ; offset += 500) {
      let query = supabaseAdmin.from("trip_batches")
        .select("id,trip_id,departure_date,return_date,price,total_seats,booked_seats,status,visibility,booking_enabled")
        .eq("visibility", "PUBLIC").eq("status", "OPEN").eq("booking_enabled", true)
        .gte("departure_date", indiaDate()).order("id").range(offset, offset + 499);
      if (filters.budget) query = query.lte("price", filters.budget);
      const { data, error } = await query.abortSignal(AbortSignal.timeout(10000));
      if (error) throw error;
      batches.push(...(data || []) as FinderBatch[]);
      if (!data || data.length < 500) break;
      if (offset >= 9500) throw new Error("Departure limit reached");
    }
    const matches = matchTrips(trips, batches, filters);
    return Response.json({ trips: matches.slice(0, 3), total: matches.length }, { headers });
  } catch {
    console.error("Trip finder catalogue lookup failed.");
    return Response.json({ error: "We couldn't check departures right now. Please try again or contact our team." }, { status: 503, headers });
  }
}
