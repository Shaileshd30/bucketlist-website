"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { fromCatalogue, validatePlan, type CatalogueTrip, type Plan, type Activity } from "@/lib/itinerary-plan";
import SkyscannerFlights from "./SkyscannerFlights";
import TripStudioPhoto from "./TripStudioPhoto";
import s from "./ItineraryPlanner.module.css";
type Message = { role: "user" | "assistant"; text: string };
const welcome = (admin: boolean): Message => ({ role: "assistant", text: admin ? "Where shall we go? Tell me the destination, duration and travel style. You can also open a published trip, then ask me to revise it." : "Choose a published journey to explore its itinerary. You can edit your daily plan and send your preferences to our team." });
function imageUrl(value?: string) {
  const clean = value?.trim();
  if (!clean) return "";
  if (clean.startsWith("/") && !clean.startsWith("//")) return clean;
  try { return new URL(clean).protocol === "https:" ? clean : ""; } catch { return ""; }
}
function tripPhotos(trip?: CatalogueTrip) {
  if (!trip) return [];
  return [...new Set([trip.image, ...(trip.images || [])].map(imageUrl).filter(Boolean))];
}
export default function ItineraryPlanner({ admin = false }: { admin?: boolean }) {
  const [trips, setTrips] = useState<CatalogueTrip[]>([]);
  const [catalogueError, setCatalogueError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [messages, setMessages] = useState<Message[]>([welcome(admin)]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"chat" | "trip">("chat");
  const [activeDay, setActiveDay] = useState(0);
  const [editing, setEditing] = useState(false);
  const [travellers, setTravellers] = useState(1);
  const [month, setMonth] = useState("");
  const [availability, setAvailability] = useState<{ key: string; price?: number; date?: string; error?: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const sending = useRef(false);
  const storageKey = admin ? "bucketlist-staff-plan-v2" : "bucketlist-travel-plan-v2";
  const source = trips.find(t => t.id === sourceId);
  const availabilityKey = JSON.stringify([source?.slug, source?.title, travellers, month]);
  const currentAvailability = availability?.key === availabilityKey ? availability : null;
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/itinerary-catalogue", { signal: controller.signal }).then(async r => {
      if (!r.ok) throw new Error(); return r.json();
    }).then(body => { if (!controller.signal.aborted) { setTrips(body.trips); setLoaded(true); } })
      .catch(() => { if (!controller.signal.aborted) { setCatalogueError("Trips could not be loaded. Refresh to retry."); setLoaded(true); } });
    return () => controller.abort();
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (!source) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ query: source.title, travelers: String(travellers), month });
    fetch(`/api/trip-finder?${params}`, { signal: controller.signal, cache: "no-store" }).then(async r => {
      if (!r.ok) throw new Error(); return r.json();
    }).then(body => {
      if (controller.signal.aborted) return;
      const match = body.trips.find((t: { slug: string }) => t.slug === source.slug);
      setAvailability({ key: availabilityKey, ...(match ? { price: match.price, date: match.date } : {}) });
    }).catch(() => { if (!controller.signal.aborted) setAvailability({ key: availabilityKey, error: "Availability check unavailable." }); });
    return () => controller.abort();
  }, [source, travellers, month, availabilityKey]);
  function openTrip(trip: CatalogueTrip) {
    if (busy) return;
    try {
      setPlan(validatePlan(fromCatalogue(trip))); setSourceId(trip.id); setActiveDay(0); setEditing(false); setError(""); setNotice(""); setTab("trip");
      setMessages(old => [...old, { role: "assistant", text: `Opened ${trip.title}. This is the published itinerary. ${admin ? "Tell me what you would like to change." : "Use Edit day to personalise it, or send your preferences to our team."}` }]);
    } catch (e) { setError(e instanceof Error ? e.message : "This itinerary cannot be opened yet."); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); const text = input.trim();
    if (text.length < 2 || sending.current) return;
    setMessages(old => [...old, { role: "user", text }]); setInput(""); setError(""); setNotice("");
    if (!admin) {
      setSearch(text);
      setMessages(old => [...old, { role: "assistant", text: "Your message is included in the enquiry. This version searches published trips; public AI generation is not connected yet. Open a journey, edit its days or send your request to our team." }]);
      return;
    }
    const controller = new AbortController(); requestRef.current = controller; sending.current = true; setBusy(true);
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch("/api/admin/itinerary-planner", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ preferences: `${text}\nTravellers: ${travellers}. Preferred month: ${month || "Flexible"}.`, currentPlan: plan }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Please log into Admin and retry.");
      const next = validatePlan(body.plan);
      setPlan(next); setSourceId(""); setActiveDay(0); setEditing(false); setTab("trip");
      setMessages(old => [...old, { role: "assistant", text: `Your ${next.days.length}-day draft is ready. You can ask for changes such as “include Hanle” or “make day 3 more relaxed”. Arrangements and travel times need review.` }]);
    } catch (e) { setError(controller.signal.aborted ? "Generation stopped. Your previous itinerary is unchanged." : e instanceof Error ? e.message : "Generation failed. Please retry."); }
    finally { clearTimeout(timer); sending.current = false; setBusy(false); requestRef.current = null; }
  }
  function save() {
    if (!plan) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 2, plan: validatePlan(plan), sourceId, travellers, month })); setNotice("Saved on this browser. Use Open saved to restore it later."); }
    catch { setNotice("This browser could not save your itinerary. Try Print / PDF instead."); }
  }
  function restore() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) { setNotice("No itinerary has been saved on this browser yet."); return; }
      const saved = JSON.parse(raw); setPlan(validatePlan(saved.plan));
      setSourceId(typeof saved.sourceId === "string" ? saved.sourceId : "");
      setTravellers(Number.isInteger(saved.travellers) && saved.travellers > 0 && saved.travellers <= 100 ? saved.travellers : 1);
      setMonth(typeof saved.month === "string" && /^20\d{2}-(0[1-9]|1[0-2])$/.test(saved.month) ? saved.month : "");
      setActiveDay(0); setEditing(false); setTab("trip"); setNotice("Opened your saved itinerary. Package availability is checked again.");
    } catch { setNotice("The saved itinerary could not be opened."); }
  }
  function newPlan() {
    if (plan && !window.confirm("Start a new plan? Save your current itinerary first if you want to keep it.")) return;
    setPlan(null); setSourceId(""); setMessages([welcome(admin)]); setInput(""); setSearch(""); setError(""); setNotice(""); setTab("chat");
  }
  function updateActivity(index: number, field: keyof Activity, value: string) {
    setPlan(old => old ? { ...old, days: old.days.map((day, di) => di === activeDay ? { ...day, activities: day.activities.map((a, ai) => ai === index ? { ...a, [field]: value } : a) } : day) } : null);
  }
  const terms = search.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const visibleTrips = trips.filter(t => !terms.length || terms.some(word => `${t.title} ${t.destination}`.toLowerCase().includes(word))).slice(0, 12);
  const day = plan?.days[activeDay]; const photos = tripPhotos(source);
  const activityCount = plan?.days.reduce((n, d) => n + d.activities.length, 0) || 0;
  const requests = messages.filter(m => m.role === "user").map(m => m.text).join("\n");
  const quote = `Hi Bucketlist Adventure! ${plan ? `Please help me plan ${plan.title}.\n${plan.days.map((d, i) => `Day ${i + 1}: ${d.title}`).join("\n")}` : "I would like help planning a trip."}\nTravellers: ${travellers}. Month: ${month || "Flexible"}.\n${requests.slice(-1800)}\nPlease confirm the itinerary and share a quote.`;
  const whatsapp = `https://wa.me/918482846287?text=${encodeURIComponent(quote)}`;
  return <main className={s.shell}>
    <header className={s.header}><Link href={admin ? "/admin" : "/"} className={s.brand}>bucketlist<span>adventure / trip studio</span></Link><div className={s.preferences}><label><span>When</span><input aria-label="Preferred month" type="month" value={month} onChange={e => setMonth(e.target.value)} disabled={busy} /></label><label><span>Travellers</span><input aria-label="Travellers" type="number" min={1} max={100} value={travellers} onChange={e => setTravellers(Math.max(1, Math.min(100, Math.trunc(Number(e.target.value) || 1))))} disabled={busy} /></label></div><button type="button" className={s.outline} onClick={newPlan} disabled={busy}>+ New trip</button></header>
    <nav className={s.mobileTabs} aria-label="Planner view"><button aria-pressed={tab === "chat"} onClick={() => setTab("chat")}>Conversation</button><button aria-pressed={tab === "trip"} onClick={() => setTab("trip")}>My itinerary {plan ? `· ${plan.days.length} days` : ""}</button></nav>
    <div className={s.workspace}>
      <aside className={`${s.chat} ${tab !== "chat" ? s.mobileHidden : ""}`}><div className={s.chatHeading}><div><small>YOUR NEXT ADVENTURE</small><h2>{admin ? "Plan together with AI" : "Find your journey"}</h2></div><span className={s.dot} /></div><div className={s.conversation} aria-live="polite" aria-relevant="additions">{messages.map((m, i) => <p key={i} className={m.role === "user" ? s.userMessage : s.assistantMessage}>{m.text}</p>)}{plan && <button className={s.planLink} onClick={() => setTab("trip")}><small>CURRENT ITINERARY</small><strong>{plan.title}</strong><span>Explore {plan.days.length} days ↗</span></button>}{busy && <p role="status" className={s.assistantMessage}>Planning your journey… Your current draft stays safe while we work.</p>}{error && <p role="alert" className={s.error}>{error}</p>}<div ref={endRef} /></div><form className={s.composer} onSubmit={submit}><label className={s.srOnly} htmlFor="planner-message">Your trip request</label><textarea id="planner-message" maxLength={1800} value={input} onChange={e => setInput(e.target.value)} placeholder={admin ? "7 days in Ladakh, include Hanle…" : "Where would you like to travel?"} disabled={busy} /><div><small>{admin ? "AI draft · Review before use" : "Published trips · Personal help"}</small>{busy ? <button type="button" onClick={() => requestRef.current?.abort()}>Stop</button> : <button type="submit" disabled={input.trim().length < 2} aria-label="Send trip request">↑</button>}</div></form><a href={whatsapp} target="_blank" rel="noopener noreferrer" className={s.expertLink}>Talk to a Bucketlist expert ↗</a></aside>
      <section className={`${s.preview} ${tab !== "trip" ? s.mobileHidden : ""}`} aria-label="Your itinerary"><div className={s.toolbar}><span>{plan ? "YOUR JOURNEY, YOUR WAY" : "A LITTLE INSPIRATION"}</span><div><button onClick={restore} disabled={busy}>Open saved</button>{plan && <><button onClick={save} disabled={busy}>Save trip</button><button onClick={() => window.print()} disabled={busy}>Print / PDF</button></>}</div></div>{notice && <p role="status" className={s.notice}>{notice}</p>}
        {plan ? <><div className={s.hero}><div className={s.cover}><TripStudioPhoto key={photos.join("|") || plan.title} urls={photos} title={source?.title || plan.title} priority /></div><div className={s.heroCopy}><small>{source ? "INSPIRED BY A BUCKETLIST JOURNEY" : "YOUR CUSTOM ITINERARY DRAFT"}</small><h1>{plan.title}</h1><p>{plan.summary}</p><div className={s.stats}><span>◷ {plan.days.length} days</span><span>✦ {activityCount} experiences</span><span>♙ {travellers} traveller{travellers > 1 ? "s" : ""}</span></div></div></div><div className={s.dayTabs} aria-label="Itinerary days">{plan.days.map((d, i) => <button key={i} aria-pressed={activeDay === i} onClick={() => { setActiveDay(i); setEditing(false); }}><span>DAY {i + 1}</span>{d.title}</button>)}</div>
          {day && <article className={s.dayCard}><div className={s.dayHeading}><div><small>DAY {activeDay + 1}</small><h2>{day.title}</h2></div><button className={s.outline} disabled={busy} onClick={() => setEditing(!editing)}>{editing ? "Done editing" : "Edit day"}</button></div>{editing && <label className={s.editField}>Day title<input value={day.title} maxLength={160} onChange={e => setPlan({ ...plan, days: plan.days.map((d, i) => i === activeDay ? { ...d, title: e.target.value } : d) })} /></label>}<div className={s.timeline}>{day.activities.map((a, i) => <div className={s.activity} key={i}><div className={s.marker}>{i + 1}</div><div className={s.activityContent}>{editing ? <fieldset disabled={busy}><legend>Activity {i + 1}</legend>{(["time", "name", "place", "note"] as const).map(field => <label className={s.editField} key={field}>{field === "name" ? "Activity" : field}{field === "note" ? <textarea value={a[field]} maxLength={1600} onChange={e => updateActivity(i, field, e.target.value)} /> : <input value={a[field]} maxLength={field === "time" ? 80 : 160} onChange={e => updateActivity(i, field, e.target.value)} />}</label>)}</fieldset> : <><small>{a.time || "Flexible time"}</small><h3>{a.name}</h3>{a.place && <span className={s.place}>⌖ {a.place}</span>}<p>{a.note}</p></>}</div></div>)}</div></article>}
          <p className={s.disclaimer}>A planning draft, not a confirmed booking. Our team will check travel times, access, acclimatisation and arrangements before finalising your trip.</p>{source && <div className={s.package}><div><small>ORIGINAL PACKAGE</small><h3>{source.title}</h3><p>{!currentAvailability ? "Checking departures…" : currentAvailability.error || (currentAvailability.price ? `From ₹${currentAvailability.price.toLocaleString("en-IN")} per person · ${currentAvailability.date}` : "Dates on request")}</p><small>Published package price only. Your edited itinerary needs a separate quote.</small></div><Link href={`/trips/${encodeURIComponent(source.slug)}`}>View departures ↗</Link></div>}<SkyscannerFlights tripTitle={plan.title} /><div className={s.bottomBar}><div><small>MAKE IT HAPPEN</small><strong>Let us plan the details.</strong></div><a href={whatsapp} target="_blank" rel="noopener noreferrer">Plan with an expert ↗</a></div></> : <div className={s.empty}><div className={s.emptyArtwork}><span>PLAN LESS. LIVE MORE.</span><strong>We turn ideas into journeys.</strong></div><div><small>YOUR TRIP STARTS HERE</small><h1>Where will your<br />next story begin?</h1><p>{admin ? "Tell us your idea in the chat, or start with one of your published trips." : "Explore a journey below, shape your itinerary and let our team take care of the details."}</p><button type="button" onClick={() => setTab("chat")}>Start planning ↗</button></div></div>}
        <div className={s.discover}><div><small>CURATED BY BUCKETLIST</small><h2>{plan ? "Explore another journey" : "Start somewhere special"}</h2><p>Real routes. Thoughtful pacing. Local support.</p></div><label><span className={s.srOnly}>Search published trips</span><input placeholder="Search destinations" value={search} onChange={e => setSearch(e.target.value)} /></label></div>{catalogueError && <p role="alert" className={s.error}>{catalogueError}</p>}{!loaded && <p role="status">Loading journeys…</p>}{loaded && !visibleTrips.length && <p>No matching published trips. Try a destination name or ask our team for a custom plan.</p>}<div className={s.tripGrid}>{visibleTrips.map(t => { const tilePhotos = tripPhotos(t); return <button key={t.id} disabled={busy} onClick={() => openTrip(t)} className={s.tripTile}><div className={s.tilePhoto}><TripStudioPhoto key={tilePhotos.join("|") || t.id} urls={tilePhotos} title={t.title} /><span className={s.tileBadge}>{t.duration_days ? `${t.duration_days} days` : "Explore"}</span><span className={s.tileArrow}>↗</span><div className={s.tileCopy}><small>{t.destination || t.start_point || "Bucketlist Adventure"}</small><h3>{t.title}</h3></div></div></button>; })}</div>
      </section>
    </div>
    {plan && <section className={s.printDocument}><h1>Bucketlist Adventure</h1><p>We Plan It. You Live It.</p><h2>{plan.title}</h2><p>{travellers} travellers · {month || "Flexible dates"}</p><p>{plan.summary}</p>{plan.days.map((d, i) => <article key={i}><h2>Day {i + 1}: {d.title}</h2>{d.activities.map((a, j) => <div key={j}><h3>{a.time} — {a.name}</h3><p>{a.place}</p><p>{a.note}</p></div>)}</article>)}<p>Unconfirmed planning draft. Contact Bucketlist Adventure to verify arrangements and receive a quote.</p><p>bucketlistadventure.in · +91 84828 46287</p></section>}
  </main>;
}
