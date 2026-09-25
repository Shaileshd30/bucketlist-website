import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { TripBatch, TripData } from "../app/data/trips";

export const tripPdfLinks = {
  reviews: "https://share.google/Q9k66ci3TGFVHkuOl",
  writeReview: "https://www.google.com/search?q=bucketlist+adventure#lrd=0x3bc2bf2b17902bb1:0x4c1a5b103ad209c7,3,,,,",
  instagram: "https://www.instagram.com/bucketlistadventuure/",
  facebook: "https://www.facebook.com/bucketlistadventures2018/",
  website: "https://bucketlistadventure.in",
};

type Assets = { regular: string; bold: string; images: Record<string, string | null> };
type Options = { trip: TripData; batch: TripBatch | null; hero: string };

// Use the browser image loader: the site's CSP allows remote images via img-src,
// but deliberately does not allow arbitrary remote fetches via connect-src.
export async function loadTripPdfImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => {
      image.onload = image.onerror = null;
      image.src = "";
      reject(new Error("A trip photo took too long to load. Please retry the PDF download."));
    }, 20000);
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("A trip photo could not be loaded. Please check the published photos and retry."));
    };
    image.onload = () => {
      window.clearTimeout(timer);
      try {
        const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image conversion unavailable.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        // Decode WebP/AVIF uploads in the browser before passing pixels to jsPDF.
        resolve(canvas.toDataURL("image/png"));
      } catch {
        reject(new Error("A trip photo could not be included in the PDF. Please check its image sharing permissions."));
      }
    };
    image.src = src;
  });
}

async function asset(src: string, required = false): Promise<string | null> {
  try {
    const response = await fetch(src, { cache: "force-cache", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Asset unavailable: ${src}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return `data:${response.headers.get("content-type") || "application/octet-stream"};base64,${btoa(binary)}`;
  } catch (error) {
    if (required) throw error;
    return null;
  }
}

export async function downloadTripPdf(options: Options) {
  const sources = [...new Set(["/bucketlist-logo.png", options.hero, ...options.trip.itinerary.flatMap(item => typeof item !== "string" && "image" in item && item.image ? [item.image] : [])])].filter(Boolean);
  const [regular, bold, images] = await Promise.all([
    asset("/fonts/quotation/DejaVuSans.ttf", true),
    asset("/fonts/quotation/DejaVuSans-Bold.ttf", true),
    Promise.all(sources.map(async src => [src, await loadTripPdfImage(src)] as const)),
  ]);
  const pdf = await createTripPdf(options, { regular: regular!.split(",")[1], bold: bold!.split(",")[1], images: Object.fromEntries(images) });
  const name = options.trip.title.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "trip";
  pdf.save(`${name}-Itinerary-Bucketlist-Adventure.pdf`);
}

// Asset injection keeps rendering testable without a browser or remote image requests.
export async function createTripPdf({ trip, batch, hero }: Options, assets: Assets) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  pdf.addFileToVFS("Trip-Regular.ttf", assets.regular);
  pdf.addFileToVFS("Trip-Bold.ttf", assets.bold);
  pdf.addFont("Trip-Regular.ttf", "Trip", "normal");
  pdf.addFont("Trip-Bold.ttf", "Trip", "bold");
  pdf.setProperties({ title: `${trip.title} | Bucketlist Adventure`, author: "Bucketlist Adventure", subject: "Trip itinerary and published departure pricing" });
  const green = "#193D2B", ink = "#17251D", muted = "#647267", orange = "#DC681F";
  const left = 18, width = 174, bottom = 271;
  let y = 35;
  const font = (size = 10, bold = false, color = ink) => { pdf.setFont("Trip", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.setTextColor(color); };
  const clean = (value: string) => value.replace(/\r/g, "").replace(/[\u2011\u2013\u2014]/g, "-").trim();
  const picture = (src: string, x: number, top: number, w: number, h: number) => {
    const data = assets.images[src];
    if (!data) return false;
    try {
      const props = pdf.getImageProperties(data);
      const ratio = Math.min(w / props.width, h / props.height);
      const iw = props.width * ratio, ih = props.height * ratio;
      pdf.addImage(data, props.fileType, x + (w - iw) / 2, top + (h - ih) / 2, iw, ih);
      return true;
    } catch { return false; }
  };
  const header = () => {
    pdf.setFillColor("#F8F6F0"); pdf.rect(0, 0, 210, 297, "F");
    pdf.setFillColor("#17281F"); pdf.rect(0, 0, 210, 28, "F");
    picture("/bucketlist-logo.png", left, 6, 42, 17);
    font(8, false, "#FFFFFF"); pdf.text("WE PLAN IT. YOU LIVE IT.", 192, 12, { align: "right" });
    const email = "bookings@bucketlistadventure.in";
    const emailWidth = pdf.getTextWidth(email);
    pdf.textWithLink(email, 192 - emailWidth, 19, { url: `mailto:${email}` });
  };
  const page = () => { pdf.addPage(); header(); y = 37; };
  const room = (height: number) => { if (y + height > bottom) page(); };
  const paragraph = (text: string, size = 10, bold = false, color = ink, maxWidth = width) => {
    font(size, bold, color);
    const lines = pdf.splitTextToSize(clean(text), maxWidth) as string[];
    const leading = size * 0.49;
    for (const line of lines) { room(leading); font(size, bold, color); pdf.text(line, left, y); y += leading; }
    y += 3;
  };
  const section = (label: string) => { room(24); y += 2; paragraph(label.toUpperCase(), 10, true, orange); y += 1; };
  const button = (label: string, url: string, x: number, top: number, w: number, dark = true) => {
    pdf.setFillColor(dark ? green : "#E8EDE5"); pdf.roundedRect(x, top, w, 12, 2, 2, "F");
    font(9, true, dark ? "#FFFFFF" : green); pdf.text(label, x + w / 2, top + 7.5, { align: "center" });
    pdf.link(x, top, w, 12, { url });
  };
  const list = (title: string, items?: string[]) => {
    if (!items?.length) return;
    section(title);
    for (const item of items) paragraph(`• ${item}`, 9);
  };
  const date = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  };
  const money = (value: number) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  // Revalidate the supplied selection; never publish private, sold-out or past batch prices.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const selected = batch && trip.batches?.find(item => item.id === batch.id);
  const priced = selected && selected.visibility === "PUBLIC" && selected.status === "OPEN" && selected.bookingEnabled && selected.totalSeats - (selected.bookedSeats || 0) > 0 && selected.departureDate.slice(0, 10) >= today && Number.isFinite(Number(selected.price)) && Number(selected.price) > 0 ? selected : null;
  const tripUrl = `${tripPdfLinks.website}/trips/${encodeURIComponent(trip.slug)}`;
  const enquiry = `https://wa.me/918482846287?text=${encodeURIComponent(`Hi Bucketlist Adventure, please share details for ${trip.title}. ${tripUrl}`)}`;
  const booking = priced ? `${tripPdfLinks.website}/book?${new URLSearchParams({ trip: trip.slug, batch: priced.id, travelers: "1" })}` : enquiry;
  header();
  paragraph(trip.travelCategory || trip.category || "YOUR NEXT ADVENTURE", 9, true, orange);
  paragraph(trip.title, 25, true, green);
  if (trip.subtitle) paragraph(trip.subtitle, 11, false, muted);
  const duration = trip.durationDays ? `${trip.durationDays} ${trip.durationDays === 1 ? "day" : "days"}` : trip.duration || "Flexible duration";
  paragraph([duration, trip.destination || trip.startPoint, trip.difficulty].filter(Boolean).join("  /  "), 9, false, muted);
  room(81);
  if (picture(hero, left, y, width, 73)) y += 81;
  section("Your journey, beautifully planned");
  if (trip.overview || trip.description || trip.summary) paragraph(trip.overview || trip.description || trip.summary || "");

  page(); section("Your trip investment");
  paragraph(priced ? `${money(priced.price)} per person` : "Pricing on request", 24, true, green);
  if (priced) {
    paragraph(`Selected departure: ${date(priced.departureDate)}${priced.returnDate ? ` to ${date(priced.returnDate)}` : ""}`, 11, true);
    const advance = Number(priced.advanceAmount);
    if (priced.paymentMode === "ADVANCE" && Number.isFinite(advance) && advance > 0 && advance < Number(priced.price)) {
      paragraph(`Reserve with ${money(advance)} per person. Remaining balance: ${money(Number(priced.price) - advance)} per person.`);
      if (priced.balanceDueDate) paragraph(`Balance due: ${date(priced.balanceDueDate)}`, 9, false, muted);
    } else if (priced.paymentMode === "FULL") paragraph("Full payment at booking.");
    paragraph("Price applies to this departure. Availability and the final payable amount are confirmed on the booking page.", 9, false, muted);
  } else paragraph("Contact our team for available dates and a current quote. This itinerary does not confirm a reservation.");
  room(53);
  const bookingQr = await QRCode.toDataURL(booking, { width: 300, margin: 2, errorCorrectionLevel: "M" });
  pdf.addImage(bookingQr, "PNG", 154, y, 37, 37);
  button(priced ? "Book this departure" : "Request dates & pricing", booking, left, y + 3, 111);
  button("View trip & latest departures", tripUrl, left, y + 19, 111, false);
  font(8, false, muted); pdf.text("Scan to continue", 172.5, y + 42, { align: "center" }); y += 53;
  list("Included", trip.includes); list("Not included", trip.notIncludes);

  page(); section("The itinerary");
  for (const [index, item] of trip.itinerary.entries()) {
    if (typeof item === "string") { paragraph(item); continue; }
    if ("activity" in item) { room(18); paragraph(`${item.time}  /  ${item.activity}`); continue; }
    room(32);
    paragraph(`DAY ${item.day || index + 1} / ${item.title}`, 14, true, green);
    if (item.location) paragraph(item.location, 9, true, orange);
    if (item.image && assets.images[item.image]) { room(57); if (picture(item.image, left, y, width, 50)) y += 57; }
    paragraph(item.description);
    for (const highlight of item.highlights || []) paragraph(`• ${highlight}`, 9);
    y += 4;
  }
  list("Pickup points", trip.pickupPoints); list("Things to carry", trip.thingsToCarry);
  list("Travel guidelines", trip.rules); list("Health & safety", trip.medicalDisclaimer);
  paragraph("The operating itinerary may vary with weather, local conditions and safety requirements.", 9, false, muted);

  page(); section("Stories from the journey");
  paragraph("Real journeys. Real reviews.", 24, true, green);
  paragraph("See what travellers share about Bucketlist Adventure on Google, or tell us about your own journey.", 11, false, muted);
  const reviewsQr = await QRCode.toDataURL(tripPdfLinks.reviews, { width: 360, margin: 2, errorCorrectionLevel: "M" });
  room(65);
  pdf.setFillColor("#E8EDE5"); pdf.roundedRect(left, y, width, 60, 3, 3, "F");
  pdf.addImage(reviewsQr, "PNG", 143, y + 6, 42, 42);
  button("Read Google reviews", tripPdfLinks.reviews, 25, y + 10, 108);
  button("Write a Google review", tripPdfLinks.writeReview, 25, y + 28, 108, false);
  font(8, false, muted); pdf.text("Scan for Google reviews", 164, y + 53, { align: "center" });
  y += 72;
  paragraph("Tap a button in your PDF reader or scan the code with your phone. Reviews open on Google.", 9, false, muted);
  section("Stay in the loop");
  paragraph("More places. More stories. Your next Bucketlist moment.", 13, true, green);
  room(35); button("Instagram", tripPdfLinks.instagram, left, y, 54); button("Facebook", tripPdfLinks.facebook, 78, y, 54); button("Website", tripPdfLinks.website, 138, y, 54); y += 22;
  button("Chat with our travel team", enquiry, left, y, width, false); y += 23;
  paragraph("Enquiries: +91 84828 46287", 10, false, muted);
  const pages = pdf.getNumberOfPages();
  for (let n = 1; n <= pages; n++) {
    pdf.setPage(n); pdf.setDrawColor("#DADFD7"); pdf.line(left, 280, 192, 280);
    font(8, false, muted); pdf.textWithLink("bucketlistadventure.in", left, 286, { url: tripUrl });
    pdf.text(`${n} / ${pages}`, 192, 286, { align: "right" });
  }
  return pdf;
}
