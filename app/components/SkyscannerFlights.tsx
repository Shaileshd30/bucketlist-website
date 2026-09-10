"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./ItineraryPlanner.module.css";

function FlightEmbed() {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let script: HTMLScriptElement | undefined;
    let observer: MutationObserver | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    // Defer initialisation so React Strict Mode's first setup is cancelled cleanly.
    const initialise = setTimeout(() => {
      if (disposed) return;
      const widget = document.createElement("div");
      const attributes = { "data-skyscanner-widget": "SearchWidget", "data-locale": "en-GB", "data-market": "IN", "data-currency": "INR", "data-flight-type": "return", "data-target": "_blank", "data-colour": "#ffffff", "data-font-colour": "#17251d", "data-button-colour": "#17251d", "data-button-font-colour": "#ffffff" };
      Object.entries(attributes).forEach(([key, value]) => widget.setAttribute(key, value));
      element.appendChild(widget);
      observer = new MutationObserver(() => {
        if (widget.querySelector("input, select, form, iframe")) {
          if (!disposed) setStatus("ready");
          clearTimeout(timeout); observer?.disconnect();
        }
      });
      observer.observe(widget, { childList: true, subtree: true });
      script = document.createElement("script"); script.async = true;
      script.src = "https://widgets.skyscanner.net/widget-server/js/loader.js";
      script.onerror = () => { if (!disposed) setStatus("unavailable"); };
      element.appendChild(script);
      timeout = setTimeout(() => { if (!disposed) { setStatus("unavailable"); observer?.disconnect(); } }, 15000);
    }, 0);
    return () => { disposed = true; clearTimeout(initialise); clearTimeout(timeout); observer?.disconnect(); script?.remove(); element.replaceChildren(); };
  }, []);
  return <div className={styles.flightEmbed}>
    {status === "loading" && <p role="status">Loading Skyscanner flight search…</p>}
    {status === "unavailable" && <p role="status">Embedded search is unavailable. You can still search directly on Skyscanner.</p>}
    <div ref={host} hidden={status === "unavailable"} />
    <p className={styles.flightNote}>Select your airports and exact travel dates. Results open in a new tab.</p>
  </div>;
}
export default function SkyscannerFlights({ tripTitle }: { tripTitle?: string }) {
  const [open, setOpen] = useState(false);
  const enquiry = `Hi Bucketlist Adventure! Please quote a trip including flights${tripTitle ? ` for ${tripTitle}` : ""}. Please confirm my departure city, dates, travellers, baggage and the current airfare.`;
  return <section className={styles.flightCard} aria-label="Flights for your trip">
    <div className={styles.flightCardTop}><span className={styles.flightIcon} aria-hidden="true">✈</span><div><small>COMPLETE THE JOURNEY</small><h2>Let’s get you there.</h2><p>Compare flights, or leave the arrangements to us.</p></div></div>
    <div className={styles.flightActions}><button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? "Close search" : "Search flights"}</button><a href="https://www.skyscanner.co.in/" target="_blank" rel="noopener noreferrer">Open Skyscanner ↗</a><a href={`https://wa.me/918482846287?text=${encodeURIComponent(enquiry)}`} target="_blank" rel="noopener noreferrer">Get a quote including flights ↗</a></div>
    {open && <FlightEmbed />}
    <p className={styles.flightNote}>Flight search by Skyscanner. Flights are quoted separately unless included in your confirmed package.</p>
  </section>;
}
