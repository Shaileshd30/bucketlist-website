"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./crm.module.css";

type Customer = { id: string; full_name: string; phone?: string; email?: string; city?: string; normalized_phone?: string; last_seen_at: string };
type Activity = { id: string; activity_type: string; note?: string; created_at: string; to_status?: string };
type Lead = { id: string; status: string; priority: string; interested_trip?: string; travel_month?: string; source: string; assigned_to?: string; next_follow_up_at?: string; updated_at: string; customer: Customer; activities: Activity[] };
type Summary = { total: number; new: number; due: number; confirmed: number };
type CustomerPayload = { customers: Customer[]; bookings: Array<Record<string, unknown>>; customBookings: Array<Record<string, unknown>> };

const statusLabels: Record<string, string> = { NEW: "New", CALLED: "Called", FOLLOW_UP: "Follow-up", INTERESTED: "Interested", QUOTATION_SENT: "Quotation sent", CONFIRMED: "Confirmed", NOT_INTERESTED: "Not interested", CLOSED: "Closed" };
const teamMembers = ["Shailesh", "Ruturaj"];
const inputClass = styles.input;
const initialForm = { fullName: "", phone: "", email: "", city: "", interestedTrip: "", travelMonth: "", source: "Website", status: "NEW", priority: "MEDIUM", assignedTo: "", nextFollowUpAt: "", notes: "" };

export default function CrmWorkspace() {
  const router = useRouter();
  const [tab, setTab] = useState<"leads" | "customers" | "import">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, new: 0, due: 0, confirmed: 0 });
  const [customers, setCustomers] = useState<CustomerPayload>({ customers: [], bookings: [], customBookings: [] });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [followUpFilter, setFollowUpFilter] = useState<"ALL" | "TODAY" | "OVERDUE" | "UNSCHEDULED">("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activity, setActivity] = useState({ activityType: "CALL", status: "", note: "", nextFollowUpAt: "", assignedTo: "" });

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/crm", { cache: "no-store" });
    if (response.status === 401) { router.replace("/admin"); return; }
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Unable to load leads.");
    else { setLeads(data.leads); setSummary(data.summary); }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    let current = true;
    void fetch("/api/admin/crm", { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { router.replace("/admin"); return; }
      const data = await response.json();
      if (!current) return;
      if (!response.ok) setMessage(data.error || "Unable to load leads.");
      else { setLeads(data.leads); setSummary(data.summary); }
      setLoading(false);
    });
    return () => { current = false; };
  }, [router]);

  async function loadCustomers() {
    setLoading(true);
    const response = await fetch(`/api/admin/crm?view=customers&search=${encodeURIComponent(search)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Unable to load customers."); else setCustomers(data);
    setLoading(false);
  }

  const visibleLeads = useMemo(() => leads.filter((lead) => {
    const query = search.toLowerCase();
    const matches = !query || [lead.customer.full_name, lead.customer.phone, lead.customer.email, lead.interested_trip].some((value) => value?.toLowerCase().includes(query));
    const followUpTime = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : null;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const isActive = !["CONFIRMED", "CLOSED", "NOT_INTERESTED"].includes(lead.status);
    const matchesFollowUp = followUpFilter === "ALL"
      || (followUpFilter === "TODAY" && followUpTime !== null && followUpTime >= todayStart && followUpTime < tomorrowStart && isActive)
      || (followUpFilter === "OVERDUE" && followUpTime !== null && followUpTime < todayStart && isActive)
      || (followUpFilter === "UNSCHEDULED" && followUpTime === null && isActive);
    const matchesAssignee = assigneeFilter === "ALL" || (assigneeFilter === "UNASSIGNED" ? !lead.assigned_to : lead.assigned_to === assigneeFilter);
    return matches && matchesFollowUp && matchesAssignee && (filter === "ALL" || lead.status === filter);
  }), [leads, search, filter, followUpFilter, assigneeFilter]);

  function followUpLabel(lead: Lead) {
    if (!lead.next_follow_up_at) return { label: "Not scheduled", urgency: "none" };
    const followUp = new Date(lead.next_follow_up_at);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const time = followUp.getTime();
    const closed = ["CONFIRMED", "CLOSED", "NOT_INTERESTED"].includes(lead.status);
    return {
      label: followUp.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      urgency: closed ? "complete" : time < todayStart ? "overdue" : time < tomorrowStart ? "today" : "upcoming",
    };
  }

  async function createLead(event: FormEvent) {
    event.preventDefault(); setMessage("");
    const response = await fetch("/api/admin/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Unable to create lead."); return; }
    setForm(initialForm); setShowCreate(false); setMessage("Lead created successfully."); await loadLeads();
  }

  async function saveActivity(event: FormEvent) {
    event.preventDefault(); if (!selectedLead) return;
    const response = await fetch("/api/admin/crm", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: selectedLead.id, ...activity, status: activity.status || selectedLead.status }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Unable to save follow-up."); return; }
    setSelectedLead(null); setActivity({ activityType: "CALL", status: "", note: "", nextFollowUpAt: "", assignedTo: "" }); setMessage("Follow-up saved."); await loadLeads();
  }

  async function assignVisibleLeads() {
    if (!bulkAssignee || visibleLeads.length === 0) return;
    if (!window.confirm(`Assign ${visibleLeads.length} displayed lead${visibleLeads.length === 1 ? "" : "s"} to ${bulkAssignee}?`)) return;
    const response = await fetch("/api/admin/crm", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadIds: visibleLeads.map((lead) => lead.id), assignedTo: bulkAssignee }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Unable to assign leads."); return; }
    setMessage(`${data.updated} lead${data.updated === 1 ? "" : "s"} assigned to ${bulkAssignee}.`);
    setBulkAssignee("");
    await loadLeads();
  }

  async function importFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("Importing leads…");
    const response = await fetch("/api/admin/crm/import", { method: "POST", body: new FormData(event.currentTarget) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Import failed.");
    else { setMessage(`Imported ${data.imported} leads. ${data.skipped} skipped, ${data.errors} errors.`); (event.target as HTMLFormElement).reset(); await loadLeads(); }
  }

  const customerTrips = selectedCustomer ? [
    ...customers.bookings.filter((booking) => String(booking.phone || "").replace(/[^0-9]/g, "") === selectedCustomer.normalized_phone).map((booking) => ({ ref: booking.booking_id, title: booking.trip_title, date: booking.departure_date, status: booking.booking_status })),
    ...customers.customBookings.filter((booking) => String(booking.phone || "").replace(/[^0-9]/g, "") === selectedCustomer.normalized_phone).map((booking) => ({ ref: booking.booking_reference, title: booking.package_name, date: booking.travel_start_date, status: booking.booking_status })),
  ] : [];

  return <main className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link href="/admin" className={styles.brand} aria-label="Bucketlist Adventure admin"><Image src="/bucketlist-logo.png" alt="Bucketlist Adventure" width={1780} height={1008} priority /><small>BUSINESS WORKSPACE</small></Link>
      <nav><button className={styles.active}>◎ <span>CRM workspace</span></button><Link href="/admin?section=trips">◇ <span>Trips & departures</span></Link><Link href="/admin?section=custom-bookings">▣ <span>Custom bookings</span></Link><Link href="/admin/itinerary-planner">✦ <span>Itinerary planner</span></Link></nav>
      <div className={styles.sideFoot}><span className={styles.liveDot} /> Secure staff area</div>
    </aside>
    <section className={styles.workspace}>
      <header className={styles.header}><div><p>Bucketlist / Customer operations</p><h1>Customers & leads</h1><span className={styles.subtitle}>Your conversations, follow-ups and traveller history.</span></div><button className={styles.primary} onClick={() => setShowCreate(true)}>＋ Add lead</button></header>
      <div className={styles.tabs}>
        <button className={tab === "leads" ? styles.tabActive : ""} onClick={() => setTab("leads")}>Lead pipeline</button>
        <button className={tab === "customers" ? styles.tabActive : ""} onClick={() => { setTab("customers"); void loadCustomers(); }}>Customers</button>
        <button className={tab === "import" ? styles.tabActive : ""} onClick={() => setTab("import")}>Import leads</button>
      </div>
      {message && <div className={styles.notice}>{message}<button onClick={() => setMessage("")}>×</button></div>}

      {tab === "leads" && <>
        <div className={styles.metrics}>{[["Total leads", summary.total], ["New enquiries", summary.new], ["Follow-ups due", summary.due], ["Confirmed", summary.confirmed]].map(([label, value], index) => <article key={String(label)}><span className={styles.metricIcon}>{["↗", "✦", "◷", "✓"][index]}</span><p>{label}</p><strong>{value}</strong></article>)}</div>
        <div className={styles.toolbar}><input aria-label="Search leads" placeholder="Search name, mobile or trip…" value={search} onChange={(e) => setSearch(e.target.value)} /><select aria-label="Filter by assignee" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}><option value="ALL">All team members</option><option value="UNASSIGNED">Unassigned</option>{teamMembers.map((name) => <option key={name}>{name}</option>)}</select><select aria-label="Filter by follow-up" value={followUpFilter} onChange={(e) => setFollowUpFilter(e.target.value as typeof followUpFilter)}><option value="ALL">All follow-ups</option><option value="TODAY">Due today</option><option value="OVERDUE">Overdue</option><option value="UNSCHEDULED">Not scheduled</option></select><select aria-label="Filter by lead stage" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="ALL">All stages</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className={styles.bulkAssign}><span>Bulk assign the currently displayed leads</span><select aria-label="Team member for bulk assignment" value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)}><option value="">Choose team member</option>{teamMembers.map((name) => <option key={name}>{name}</option>)}</select><button type="button" disabled={!bulkAssignee || visibleLeads.length === 0} onClick={() => void assignVisibleLeads()}>Assign {visibleLeads.length} shown</button></div>
        <div className={styles.tableCard}><div className={styles.tableHead}><span>Customer</span><span>Interest</span><span>Stage</span><span>Next follow-up</span><span>Owner</span></div>
          {loading ? <div className={styles.empty}>Loading customer pipeline…</div> : visibleLeads.length === 0 ? <div className={styles.empty}>No leads match these filters.</div> : visibleLeads.map((lead) => { const followUp = followUpLabel(lead); return <button className={styles.leadRow} key={lead.id} onClick={() => { setSelectedLead(lead); setActivity((value) => ({ ...value, status: lead.status, assignedTo: lead.assigned_to || "" })); }}><span className={styles.customer}><b>{lead.customer.full_name.charAt(0)}</b><span><strong>{lead.customer.full_name}</strong><small>{lead.customer.phone || lead.customer.email}</small></span></span><span><strong>{lead.interested_trip || "Trip not selected"}</strong><small>{lead.travel_month || lead.source}</small></span><span><em data-status={lead.status}>{statusLabels[lead.status]}</em></span><span className={styles.followUp} data-urgency={followUp.urgency}><strong>{followUp.label}</strong>{followUp.urgency === "overdue" && <small>Overdue</small>}{followUp.urgency === "today" && <small>Due today</small>}</span><span>{lead.assigned_to || "Unassigned"} →</span></button>; })}</div>
      </>}

      {tab === "customers" && <><div className={styles.toolbar}><input placeholder="Search customer…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void loadCustomers()} /><button onClick={() => void loadCustomers()}>Search</button></div><div className={styles.customerGrid}>{customers.customers.map((customer) => { const count = [...customers.bookings, ...customers.customBookings].filter((booking) => String(booking.phone || "").replace(/[^0-9]/g, "") === customer.normalized_phone).length; return <button key={customer.id} onClick={() => setSelectedCustomer(customer)}><b>{customer.full_name.charAt(0)}</b><div><strong>{customer.full_name}</strong><span>{customer.phone || customer.email}</span><small>{count} booking{count === 1 ? "" : "s"} · Last seen {new Date(customer.last_seen_at).toLocaleDateString("en-IN")}</small></div><i>→</i></button>; })}</div></>}

      {tab === "import" && <div className={styles.importPanel}><div className={styles.uploadIcon}>⇧</div><p>Bring your leads together</p><h2>Upload an Excel or CSV sheet</h2><span>Up to 2,000 leads per file. Existing customers are matched using mobile or email.</span><form onSubmit={importFile}><input type="file" name="file" accept=".xlsx,.csv" required /><button className={styles.primary}>Import leads</button></form><a href="/templates/bucketlist-lead-import-template.xlsx" download>Download the ready-to-use template ↓</a><div className={styles.columnGuide}><strong>Recognised columns</strong><p>Customer Name · Mobile · Email · Interested Trip · Travel Month · Lead Source · Status · Next Follow-up · Assigned To · Notes</p></div></div>}
    </section>

    {showCreate && <div className={styles.overlay} onMouseDown={() => setShowCreate(false)}><form className={styles.modal} onSubmit={createLead} onMouseDown={(e) => e.stopPropagation()}><button type="button" className={styles.close} onClick={() => setShowCreate(false)}>×</button><p>New enquiry</p><h2>Add a lead</h2><div className={styles.formGrid}><label>Customer name *<input className={inputClass} required minLength={2} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label><label>Mobile number<input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>Email<input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Interested trip<input className={inputClass} value={form.interestedTrip} onChange={(e) => setForm({ ...form, interestedTrip: e.target.value })} /></label><label>Travel month<input className={inputClass} placeholder="e.g. December 2026" value={form.travelMonth} onChange={(e) => setForm({ ...form, travelMonth: e.target.value })} /></label><label>Lead source<select className={inputClass} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}><option>Website</option><option>WhatsApp</option><option>Instagram</option><option>Google</option><option>Referral</option><option>Walk-in</option><option>Other</option></select></label><label>Assigned to<select className={inputClass} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}><option value="">Unassigned</option>{teamMembers.map((name) => <option key={name}>{name}</option>)}</select></label><label>Next follow-up<input className={inputClass} type="datetime-local" value={form.nextFollowUpAt} onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })} /></label><label className={styles.full}>Notes<textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label></div><button className={styles.primary}>Save lead</button></form></div>}

    {selectedLead && <div className={styles.overlay} onMouseDown={() => setSelectedLead(null)}><form className={styles.drawer} onSubmit={saveActivity} onMouseDown={(e) => e.stopPropagation()}><button type="button" className={styles.close} onClick={() => setSelectedLead(null)}>×</button><p>Lead follow-up</p><h2>{selectedLead.customer.full_name}</h2><div className={styles.contactActions}>{selectedLead.customer.phone && <><a href={`tel:${selectedLead.customer.phone}`}>Call now</a><a href={`https://wa.me/${selectedLead.customer.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">WhatsApp ↗</a></>}{selectedLead.customer.email && <a href={`mailto:${selectedLead.customer.email}`}>Email</a>}</div><div className={styles.formGrid}><label>Contact method<select className={inputClass} value={activity.activityType} onChange={(e) => setActivity({ ...activity, activityType: e.target.value })}><option value="CALL">Phone call</option><option value="WHATSAPP">WhatsApp</option><option value="EMAIL">Email</option><option value="MEETING">Meeting</option><option value="NOTE">Note only</option></select></label><label>Assigned to<select className={inputClass} value={activity.assignedTo} onChange={(e) => setActivity({ ...activity, assignedTo: e.target.value })}><option value="">Unassigned</option>{teamMembers.map((name) => <option key={name}>{name}</option>)}</select></label><label>Lead stage<select className={inputClass} value={activity.status} onChange={(e) => setActivity({ ...activity, status: e.target.value })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className={styles.full}>Conversation notes<textarea className={inputClass} required rows={4} value={activity.note} onChange={(e) => setActivity({ ...activity, note: e.target.value })} /></label><label className={styles.full}>Next follow-up<input className={inputClass} type="datetime-local" value={activity.nextFollowUpAt} onChange={(e) => setActivity({ ...activity, nextFollowUpAt: e.target.value })} /></label></div><button className={styles.primary}>Save follow-up</button><div className={styles.timeline}><h3>Activity history</h3>{[...(selectedLead.activities || [])].sort((a,b) => b.created_at.localeCompare(a.created_at)).map((item) => <div key={item.id}><i /><span><strong>{item.activity_type.replace("_", " ")}</strong><small>{new Date(item.created_at).toLocaleString("en-IN")}</small><p>{item.note || statusLabels[item.to_status || ""]}</p></span></div>)}</div></form></div>}

    {selectedCustomer && <div className={styles.overlay} onMouseDown={() => setSelectedCustomer(null)}><section className={styles.drawer} onMouseDown={(e) => e.stopPropagation()}><button className={styles.close} onClick={() => setSelectedCustomer(null)}>×</button><p>Customer profile</p><h2>{selectedCustomer.full_name}</h2><span>{selectedCustomer.phone} · {selectedCustomer.email}</span><div className={styles.profileStat}><strong>{customerTrips.length}</strong><span>Trips and treks booked with Bucketlist Adventure</span></div><h3>Journey history</h3>{customerTrips.length ? customerTrips.map((trip) => <article className={styles.tripHistory} key={String(trip.ref)}><span>✓</span><div><strong>{String(trip.title)}</strong><small>{trip.date ? new Date(String(trip.date)).toLocaleDateString("en-IN") : "Date not set"} · {String(trip.status)}</small><p>{String(trip.ref)}</p></div></article>) : <div className={styles.empty}>No confirmed booking history yet.</div>}</section></div>}
  </main>;
}
