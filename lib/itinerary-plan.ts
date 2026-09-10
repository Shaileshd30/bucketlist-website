export type Activity = { time: string; name: string; place: string; note: string };
export type Plan = { title: string; summary: string; days: { title: string; activities: Activity[] }[] };
export type CatalogueTrip = { id: string; slug: string; title: string; destination: string; image?: string; images?: string[]; duration_days?: number; start_point?: string; itinerary: unknown };
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid itinerary");
  return value as Record<string, unknown>;
}
function text(value: unknown, limit: number): string {
  if (typeof value !== "string" || value.length > limit) throw new Error("Invalid itinerary text");
  return value.trim();
}
export function validatePlan(value: unknown): Plan {
  const p = record(value);
  if (!Array.isArray(p.days) || !p.days.length || p.days.length > 14) throw new Error("Use 1–14 days");
  return { title: text(p.title, 160), summary: text(p.summary, 1200), days: p.days.map(raw => {
    const day = record(raw);
    if (!Array.isArray(day.activities) || !day.activities.length || day.activities.length > 8) throw new Error("Invalid activities");
    return { title: text(day.title, 160), activities: day.activities.map(rawActivity => {
      const a = record(rawActivity);
      return { time: text(a.time, 80), name: text(a.name, 160), place: text(a.place, 160), note: text(a.note, 1600) };
    }) };
  }) };
}
export function fromCatalogue(trip: CatalogueTrip): Plan {
  const rows = Array.isArray(trip.itinerary) ? trip.itinerary : [];
  const activities = rows.filter(x => x && typeof x === "object" && "activity" in x);
  if ((activities.length === rows.length && rows.length > 8) || (activities.length !== rows.length && rows.length > 14)) throw new Error("This itinerary is too long for this editor. Please contact our team for the complete plan.");
  if (activities.length === rows.length && rows.length) {
    return { title: trip.title, summary: "Published itinerary — customise this draft with our team.", days: [{ title: trip.title, activities: activities.slice(0, 8).map(a => ({ time: String(a.time || ""), name: String(a.activity || ""), place: trip.destination || "", note: "" })) }] };
  }
  return { title: trip.title, summary: "Based on our published itinerary. Changes are subject to confirmation.", days: rows.slice(0, 14).map((row, i) => {
    const r = typeof row === "object" && row ? row : {};
    return { title: "title" in r ? String(r.title) : `Day ${i + 1}`, activities: [{ time: "As per itinerary", name: "title" in r ? String(r.title) : "Planned activities", place: "location" in r ? String(r.location || "") : trip.destination || "", note: typeof row === "string" ? row : "description" in r ? String(r.description) : "Contact our team for details." }] };
  }) };
}
export function adminItinerary(plan: Plan) {
  return plan.days.map((day, i) => ({ day: String(i + 1), title: day.title,
    description: day.activities.map(a => `${a.time}: ${a.name}${a.place ? ` (${a.place})` : ""}\n${a.note}`).join("\n\n"),
    location: day.activities.map(a => a.place).filter(Boolean).join(", "), highlights: day.activities.map(a => a.name) }));
}
export const planSchema = {
  type: "object", required: ["title", "summary", "days"], properties: {
    title: { type: "string" }, summary: { type: "string" }, days: { type: "array",
      items: { type: "object", required: ["title", "activities"], properties: { title: { type: "string" }, activities: {
        type: "array", items: { type: "object", required: ["time", "name", "place", "note"],
          properties: { time: { type: "string" }, name: { type: "string" }, place: { type: "string" }, note: { type: "string" } } }
      } } } }
  }
};
