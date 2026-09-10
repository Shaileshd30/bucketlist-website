import { supabaseAdmin } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";
export async function GET() {
  const trips = [];
  for (let offset = 0; offset < 10000; offset += 500) {
    const { data, error } = await supabaseAdmin.from("trips")
      .select("id,slug,title,destination,image,gallery,duration_days,start_point,itinerary").eq("archived", false)
      .order("id").range(offset, offset + 499).abortSignal(AbortSignal.timeout(10000));
    if (error) return Response.json({ error: "Trips are unavailable. Please try again." }, { status: 503 });
    trips.push(...(data || []).map(row => {
      const gallery = Array.isArray(row.gallery) ? row.gallery : [];
      const days = Array.isArray(row.itinerary) ? row.itinerary : [];
      const images = [...new Set([row.image, ...gallery, ...days.map(day => day && typeof day === "object" && "image" in day ? day.image : null)]
        .filter((value): value is string => typeof value === "string")
        .map(value => value.trim())
        .filter(value => /^https:\/\//i.test(value) || /^\/(?!\/)/.test(value)))];
      return { id: row.id, slug: row.slug, title: row.title, destination: row.destination,
        image: images[0] || "", images, duration_days: row.duration_days, start_point: row.start_point, itinerary: row.itinerary };
    }));
    if (!data || data.length < 500) return Response.json({ trips }, { headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ error: "Catalogue could not be loaded completely." }, { status: 503 });
}
