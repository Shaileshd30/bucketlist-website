"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FinderResult } from "@/lib/trip-finder";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${value}T00:00:00+05:30`));
const field = "mt-1 w-full rounded-xl border border-black/20 bg-white p-3 text-base text-[#17251d] focus:outline-2 focus:outline-orange-500";

export default function TripFinderWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FinderResult[] | null>(null);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState("");
  const [group, setGroup] = useState(1);
  const button = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const controller = useRef<AbortController | null>(null);
  const hidden = /^\/(admin|api|book)(\/|$)/.test(pathname) || /^\/(payment|payments)(\/|$)/.test(pathname);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (open) close.current?.focus(); }, [open]);
  function dismiss() { setOpen(false); button.current?.focus(); }
  const whatsapp = `https://wa.me/919225531257?text=${encodeURIComponent(`Hi Bucketlist Adventure, please help me find a trip.${summary ? ` My preferences: ${summary}` : ""}`)}`;
  if (hidden) return null;
  return (
    <aside aria-label="Trip finder">
      <button ref={button} type="button" aria-expanded={open} aria-controls="bucketlist-trip-finder" onClick={() => open ? dismiss() : setOpen(true)}
        className="fixed bottom-5 left-4 z-[60] rounded-full border border-white/30 bg-[#17251d] px-5 py-3 text-sm font-bold text-white shadow-lg focus-visible:outline-2 focus-visible:outline-orange-500 sm:left-6">
        {open ? "Close finder" : "Find my trip ↗"}
      </button>
      {open && <section id="bucketlist-trip-finder" aria-labelledby="trip-finder-title" onKeyDown={event => { if (event.key === "Escape") dismiss(); }}
        className="fixed bottom-20 left-3 z-[70] flex max-h-[calc(100dvh-110px)] w-[calc(100vw-24px)] max-w-[430px] flex-col overflow-hidden rounded-3xl border border-black/10 bg-[#f5f3ee] text-[#17251d] shadow-2xl sm:left-6">
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#17251d] p-5 text-white">
          <div><h2 id="trip-finder-title" className="text-xl font-bold">Find your next adventure</h2><p className="mt-1 text-sm text-white/80">Choose your preferences. Explore real departures.</p></div>
          <button ref={close} type="button" onClick={dismiss} aria-label="Close trip finder" className="rounded-lg p-2 text-xl focus-visible:outline-2 focus-visible:outline-orange-400">×</button>
        </header>
        <div className="overflow-y-auto overscroll-contain p-5">
          <form onSubmit={async event => {
            event.preventDefault();
            if (busy) return;
            const data = new FormData(event.currentTarget);
            const params = new URLSearchParams();
            for (const name of ["query", "category", "budget", "month", "travelers"]) params.set(name, String(data.get(name) || ""));
            const preferences = [params.get("query"), params.get("category"), params.get("budget") ? `up to INR ${params.get("budget")} per person` : "flexible budget", params.get("month") || "flexible dates", `${params.get("travelers")} travellers`].filter(Boolean).join(" · ");
            setSummary(preferences); setGroup(Number(params.get("travelers"))); setBusy(true); setError(""); setResults(null);
            controller.current?.abort();
            const abort = new AbortController(); controller.current = abort;
            const timer = setTimeout(() => abort.abort(), 25000);
            try {
              const response = await fetch(`/api/trip-finder?${params}`, { signal: abort.signal, cache: "no-store" });
              if (!response.ok) throw new Error("Lookup failed");
              const body = await response.json();
              if (!Array.isArray(body.trips) || typeof body.total !== "number") throw new Error("Invalid response");
              setResults(body.trips); setTotal(body.total);
            } catch { setError("We couldn't check departures right now. Please try again or ask us on WhatsApp."); }
            finally { clearTimeout(timer); setBusy(false); }
          }}>
            <fieldset disabled={busy} className="space-y-3 disabled:opacity-70">
              <legend className="sr-only">Trip preferences</legend>
              <label className="block text-sm font-semibold">Destination, trip or starting city
                <input name="query" maxLength={80} placeholder="For example, Pune or Kedarkantha" className={field} />
              </label>
              <label className="block text-sm font-semibold">Travel style
                <select name="category" className={field}><option value="">Any style</option><option>Treks &amp; Adventures</option><option>Domestic Tours</option><option>International Tours</option></select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">Budget per person
                  <input name="budget" type="number" min="1" max="10000000" step="1" placeholder="Any budget" className={field} />
                </label>
                <label className="block text-sm font-semibold">Travellers
                  <input name="travelers" type="number" required min="1" max="100" step="1" defaultValue="1" className={field} />
                </label>
              </div>
              <label className="block text-sm font-semibold">Departure month (optional)
                <input name="month" type="month" className={field} />
              </label>
              <button type="submit" className="w-full rounded-full bg-[#17251d] px-5 py-3 font-bold text-white focus-visible:outline-2 focus-visible:outline-orange-500">{busy ? "Checking departures…" : "Find matching trips"}</button>
            </fieldset>
          </form>
          <div role="status" aria-live="polite" className="mt-4 text-sm">
            {busy && "Checking current dates and seats…"}
            {error && <p>{error}</p>}
            {results && <p>{results.length ? `Showing ${results.length} of ${total} matching trips for ${group} traveller${group === 1 ? "" : "s"}.` : "No open departures match all these preferences. Try a different month or budget, or ask us about a custom trip."}</p>}
          </div>
          {results?.map(trip => <article key={trip.slug} className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
            <h3 className="text-lg font-bold">{trip.title}</h3>
            <p className="mt-2 text-sm">{date(trip.date)} – {date(trip.returnDate)}</p>
            <p className="mt-1 text-sm">Starts: {trip.startPoint} · Difficulty: {trip.difficulty}</p>
            <p className="mt-3 text-lg font-bold">{money(trip.price)} <span className="text-xs font-normal">per person · selected departure</span></p>
            <p className="text-sm">{trip.seats} seats currently available</p>
            <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">Package details</summary>
              <p className="mt-2 whitespace-pre-line">{trip.summary || "See the trip page for the full itinerary."}</p>
              <p className="mt-3 font-bold">Includes</p>
              {trip.includes.length ? <ul className="ml-4 list-disc">{trip.includes.map((item,index) => <li key={index}>{item}</li>)}</ul> : <p>Check with our team.</p>}
              <p className="mt-3 font-bold">Excludes</p>
              {trip.excludes.length ? <ul className="ml-4 list-disc">{trip.excludes.map((item,index) => <li key={index}>{item}</li>)}</ul> : <p>Check with our team.</p>}
            </details>
            <Link onClick={dismiss} href={`/trips/${encodeURIComponent(trip.slug)}`} className="mt-4 inline-block font-bold underline underline-offset-4">View trip and departure options ↗</Link>
          </article>)}
          {results && results.length > 0 && <p className="mt-3 text-xs">Seats and prices may change. Reconfirm your selected departure on the trip page before booking. Review inclusions and exclusions for additional costs.</p>}
          <nav aria-label="Trip finder help" className="mt-5 space-y-3 border-t border-black/10 pt-4 text-sm">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="block font-bold underline underline-offset-4">Ask our team on WhatsApp ↗</a>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link onClick={dismiss} href="/trips" className="underline">Browse all trips</Link>
              <Link onClick={dismiss} href="/corporate-outings-pune" className="underline">Corporate outings</Link>
              <Link onClick={dismiss} href="/cancellation-policy" className="underline">Cancellation &amp; refunds</Link>
              <Link onClick={dismiss} href="/contact" className="underline">Booking support</Link>
            </div>
          </nav>
        </div>
      </section>}
    </aside>
  );
}
