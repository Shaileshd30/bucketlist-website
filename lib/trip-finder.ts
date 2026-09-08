export type FinderFilters = { category: string; budget: number; month: string; travelers: number; query: string };
export type FinderTrip = {
  id: string; slug: string; title: string; archived: boolean;
  travel_category: string | null; destination: string | null; difficulty: string | null;
  start_point: string | null; duration_days: number | null; summary: string | null;
  includes: string[] | null; not_includes: string[] | null;
};
export type FinderBatch = {
  id: string; trip_id: string; departure_date: string; return_date: string;
  price: number | string; total_seats: number; booked_seats: number;
  status: string; visibility: string; booking_enabled: boolean;
};
export type FinderResult = {
  slug: string; title: string; date: string; returnDate: string; price: number;
  seats: number; startPoint: string; difficulty: string; duration: number | null;
  summary: string; includes: string[]; excludes: string[];
};
export function indiaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(key => parts.find(part => part.type === key)?.value).join("-");
}
export function parseFilters(params: URLSearchParams): FinderFilters {
  const category = params.get("category") || "";
  const budget = Number(params.get("budget") || 0);
  const travelers = Number(params.get("travelers") || 1);
  const month = params.get("month") || "";
  const query = (params.get("query") || "").trim();
  if (!["", "Treks & Adventures", "Domestic Tours", "International Tours"].includes(category) ||
      !Number.isFinite(budget) || budget < 0 || budget > 10000000 ||
      !Number.isInteger(travelers) || travelers < 1 || travelers > 100 ||
      (month !== "" && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) || query.length > 80) {
    throw new Error("Invalid filters");
  }
  return { category, budget, travelers, month, query };
}
export function matchTrips(trips: FinderTrip[], batches: FinderBatch[], filters: FinderFilters, today = indiaDate()): FinderResult[] {
  const results: FinderResult[] = [];
  for (const trip of trips) {
    if (trip.archived !== false || !trip.slug || !trip.title) continue;
    if (filters.category && trip.travel_category !== filters.category) continue;
    const searchable = `${trip.title} ${trip.destination || ""} ${trip.start_point || ""}`.toLocaleLowerCase();
    if (filters.query && !searchable.includes(filters.query.toLocaleLowerCase())) continue;
    const eligible = batches.filter(batch => {
      const price = Number(batch.price);
      return batch.trip_id === trip.id && batch.visibility === "PUBLIC" && batch.status === "OPEN" &&
        batch.booking_enabled === true && /^\d{4}-\d{2}-\d{2}$/.test(batch.departure_date) && batch.departure_date >= today &&
        Number.isInteger(batch.total_seats) && Number.isInteger(batch.booked_seats) && batch.booked_seats >= 0 &&
        batch.total_seats - batch.booked_seats >= filters.travelers && Number.isFinite(price) && price > 0 &&
        (!filters.budget || price <= filters.budget) && (!filters.month || batch.departure_date.startsWith(filters.month));
    }).sort((a,b) => a.departure_date.localeCompare(b.departure_date) || Number(a.price) - Number(b.price));
    const batch = eligible[0];
    if (!batch) continue;
    results.push({ slug: trip.slug, title: trip.title, date: batch.departure_date, returnDate: batch.return_date,
      price: Number(batch.price), seats: batch.total_seats - batch.booked_seats,
      startPoint: trip.start_point || "See trip details", difficulty: trip.difficulty || "See trip details",
      duration: trip.duration_days, summary: (trip.summary || "").slice(0, 450),
      includes: (trip.includes || []).slice(0, 15), excludes: (trip.not_includes || []).slice(0, 15) });
  }
  return results.sort((a,b) => a.date.localeCompare(b.date) || a.price - b.price);
}
