"use client";

import Link from "next/link";
import { jsPDF } from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { defaultTrips, type DayWiseItineraryItem, type TripBatch, type TripData } from "../../data/trips";

type BookingFormState = {
  name: string;
  phone: string;
  travelers: string;
  message: string;
};

const pdfAssetToDataUrl = async (
  src: string
): Promise<string | null> => {
  if (!src) return null;

  try {
    const response = await fetch(src, { cache: "force-cache" });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();

      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);

      reader.onerror = () => resolve(null);

      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const pdfImageFormat = (dataUrl: string) => {
  const normalized = dataUrl.toLowerCase();

  if (normalized.startsWith("data:image/png")) return "PNG";
  if (normalized.startsWith("data:image/webp")) return "WEBP";

  return "JPEG";
};

const safePdfFileName = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "trip";

export function TripPageClient({ trip }: { trip: TripData }) {
  const brandLogo = "/bucketlist-logo.png";
  const pdfLogo = "/icon.png";
  const pageRef = useRef<HTMLElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>(trip.image || "");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [expandedItineraryDays, setExpandedItineraryDays] = useState<number[]>([0]);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [booking, setBooking] = useState<BookingFormState>({
    name: "",
    phone: "",
    travelers: "1",
    message: `I'm interested in ${trip.title}. Please share the available dates and details.`,
  });

  useEffect(() => {
    const gallery =
      trip.gallery && trip.gallery.length > 0
        ? trip.gallery
        : [trip.image].filter(Boolean);

    setSelectedImage((current) =>
      current && gallery.includes(current)
        ? current
        : gallery[0] || trip.image || ""
    );
  }, [trip]);

  const gallery = useMemo(() => {
    const items =
      trip.gallery && trip.gallery.length > 0
        ? trip.gallery
        : [trip.image].filter(Boolean);

    return Array.from(new Set(items.filter(Boolean)));
  }, [trip]);

  const primaryImage = selectedImage || gallery[0] || trip.image;

  const overview = trip.overview || trip.description || "";
  const itinerary = trip.itinerary || [];
  const includes = trip.includes || [];
  const excludes = trip.notIncludes || [];
  const pickupPoints = trip.pickupPoints || [];
  const thingsToCarry = trip.thingsToCarry || [];
  const medicalDisclaimer = trip.medicalDisclaimer || [];
  const rules = trip.rules || [];

  /*
   * Available public batches
   */
  const availableBatches = useMemo(() => {
    if (!trip.batches || trip.batches.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...trip.batches]
      .filter(
        (batch) =>
          batch.visibility === "PUBLIC" &&
          batch.status === "OPEN" &&
          batch.bookingEnabled &&
          batch.totalSeats - (batch.bookedSeats || 0) > 0 &&
          new Date(batch.departureDate).getTime() >= today.getTime()
      )
      .sort(
        (a, b) =>
          new Date(a.departureDate).getTime() -
          new Date(b.departureDate).getTime()
      );
  }, [trip]);

  /*
   * Select the first available batch automatically.
   */
  useEffect(() => {
    if (availableBatches.length === 0) {
      setSelectedBatchId("");
      return;
    }

    setSelectedBatchId((current) => {
      const stillAvailable = availableBatches.some(
        (batch) => batch.id === current
      );

      return stillAvailable ? current : availableBatches[0].id;
    });
  }, [availableBatches]);

  const selectedBatch: TripBatch | null =
    availableBatches.find((batch) => batch.id === selectedBatchId) || null;
    const nextBatch = availableBatches[0] || null;

const displayBatch = selectedBatch || nextBatch;

const displayDuration = trip.durationDays
  ? `${trip.durationDays} ${trip.durationDays === 1 ? "Day" : "Days"}`
  : trip.duration || "Flexible";

const displayAvailableSeats = displayBatch
  ? Math.max(
      0,
      displayBatch.totalSeats - (displayBatch.bookedSeats || 0)
    )
  : null;

  /*
   * Helpers
   */
  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const travelerCount = Math.max(
    1,
    Number.parseInt(booking.travelers || "1", 10) || 1
  );

  const currentPrice =
  displayBatch?.price ??
  (trip.price
    ? Number(trip.price.replace(/[^0-9]/g, "")) || 0
    : 0);

  const totalAmount = currentPrice * travelerCount;

  const availableSeats = displayAvailableSeats;

  const isEnoughSeats =
    availableSeats === null ||
    (availableSeats > 0 && travelerCount <= availableSeats);

  /*
   * SEO-friendly traveller FAQs.
   *
   * These are generated only from information already available
   * for the trip, so the answers stay accurate for every trip
   * without adding a separate FAQ field to Supabase yet.
   */
  const faqs = useMemo(() => {
    const items: Array<{
      question: string;
      answer: string;
    }> = [];

    if (trip.difficulty) {
      items.push({
        question: `What is the difficulty level of ${trip.title}?`,
        answer: `${trip.title} is currently listed as ${trip.difficulty}. Travelers should review the itinerary, terrain and medical guidance before booking.`,
      });
    }

    if (displayDuration) {
      items.push({
        question: `How long is ${trip.title}?`,
        answer: `${trip.title} has a planned duration of ${displayDuration}. Please check the itinerary on this page for the detailed trip flow.`,
      });
    }

    if (trip.startPoint) {
      items.push({
        question: `Where does ${trip.title} start from?`,
        answer: `${trip.title} starts from ${trip.startPoint}. Any available pickup points and reporting instructions are listed on this page and shared with confirmed participants.`,
      });
    }

    if (displayBatch) {
      items.push({
        question: `When is the next departure for ${trip.title}?`,
        answer: `The next currently available departure shown on this page is ${formatDate(
          displayBatch.departureDate
        )}. Departure availability can change as seats are booked.`,
      });
    }

    if (currentPrice) {
      items.push({
        question: `What is the price of ${trip.title}?`,
        answer: `The currently displayed price starts from ${formatPrice(
          currentPrice
        )} per person. Select an available departure to see the applicable batch price and booking details.`,
      });
    }

    if (includes.length > 0) {
      items.push({
        question: `What is included in ${trip.title}?`,
        answer: `The trip currently includes ${includes
          .slice(0, 5)
          .join(
            ", "
          )}${includes.length > 5 ? ", and other inclusions listed on this page" : ""}. Please review the complete Included section before booking.`,
      });
    }

    if (thingsToCarry.length > 0) {
      items.push({
        question: `What should I carry for ${trip.title}?`,
        answer: `Recommended items include ${thingsToCarry
          .slice(0, 5)
          .join(
            ", "
          )}${thingsToCarry.length > 5 ? ", along with the remaining items listed in the Things to Carry section" : ""}.`,
      });
    }

    return items.slice(0, 6);
  }, [
    currentPrice,
    displayBatch,
    displayDuration,
    includes,
    thingsToCarry,
    trip.difficulty,
    trip.startPoint,
    trip.title,
  ]);

  /*
   * WhatsApp enquiry
   */
  const submitBooking = (event: React.FormEvent) => {
    event.preventDefault();

    const selectedDate = selectedBatch
      ? formatDate(selectedBatch.departureDate)
      : "Flexible / To be confirmed";

    const message = [
      `Hi Bucketlist Adventure,`,
      ``,
      `I am interested in ${trip.title}.`,
      ``,
      selectedBatch
        ? `Departure: ${selectedDate}`
        : "Departure: Please suggest available dates.",
      `Travelers: ${travelerCount}`,
      currentPrice ? `Price per person: ${formatPrice(currentPrice)}` : "",
      currentPrice ? `Estimated total: ${formatPrice(totalAmount)}` : "",
      booking.name ? `Name: ${booking.name}` : "",
      booking.phone ? `Phone: ${booking.phone}` : "",
      booking.message ? `Message: ${booking.message}` : "",
      ``,
      `Please share the next steps.`,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/918482846287?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /*
   * Direct booking
   *
   * For now this sends the customer to our booking page.
   * We will build the actual registration + payment system
   * in the next phase.
   */
  const handleBookNow = () => {
    if (!selectedBatch) {
      return;
    }

    if (!isEnoughSeats) {
      alert("Please reduce the number of travelers.");
      return;
    }

    const params = new URLSearchParams({
      trip: trip.slug,
      batch: selectedBatch.id,
      travelers: String(travelerCount),
    });

    window.location.href = `/book?${params.toString()}`;
  };

  const isDayWiseItineraryItem = (
    item: TripData["itinerary"][number]
  ): item is DayWiseItineraryItem =>
    typeof item !== "string" &&
    "title" in item &&
    "description" in item;

  const dayWiseItinerary = itinerary.filter(isDayWiseItineraryItem);
  const hasDayWiseItinerary = dayWiseItinerary.length > 0;

  /*
   * Automatic route map
   *
   * Uses the location already entered for each day-wise itinerary item.
   * No Maps API key is required. The visual route stays lightweight while
   * the Google Maps button opens the full multi-stop route externally.
   */
  const routeStops = useMemo(() => {
    const stops = dayWiseItinerary
      .map((day, index) => ({
        day: day.day || index + 1,
        title: day.title?.trim() || `Day ${day.day || index + 1}`,
        location: day.location?.trim() || "",
      }))
      .filter((stop) => stop.location);

    return stops.filter(
      (stop, index) =>
        index === 0 ||
        stop.location.toLowerCase() !== stops[index - 1].location.toLowerCase()
    );
  }, [dayWiseItinerary]);

  const googleMapsRouteUrl = useMemo(() => {
    if (routeStops.length === 0) return "";

    if (routeStops.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        routeStops[0].location
      )}`;
    }

    const origin = routeStops[0].location;
    const destination = routeStops[routeStops.length - 1].location;
    const waypoints = routeStops.slice(1, -1).map((stop) => stop.location);

    const params = new URLSearchParams({
      api: "1",
      origin,
      destination,
      travelmode: "driving",
    });

    if (waypoints.length > 0) {
      params.set("waypoints", waypoints.join("|"));
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }, [routeStops]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const root = pageRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const context = gsap.context(() => {
      gsap.from("[data-trip-back]", {
        opacity: 0,
        y: -10,
        duration: 0.45,
        ease: "power2.out",
      });

      gsap.from("[data-trip-hero-image]", {
        opacity: 0,
        scale: 1.04,
        duration: 1,
        ease: "power3.out",
      });

      gsap.from("[data-trip-hero-copy] > *", {
        opacity: 0,
        y: 18,
        duration: 0.65,
        stagger: 0.08,
        delay: 0.08,
        ease: "power3.out",
      });

      gsap.utils.toArray<HTMLElement>("[data-trip-reveal]").forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
        });
      });

      gsap.utils
        .toArray<HTMLElement>("[data-itinerary-card]")
        .forEach((element, index) => {
          gsap.from(element, {
            opacity: 0,
            y: 24,
            duration: 0.55,
            delay: Math.min(index * 0.04, 0.2),
            ease: "power2.out",
            scrollTrigger: {
              trigger: element,
              start: "top 92%",
              once: true,
            },
          });
        });
    }, root);

    return () => context.revert();
  }, [trip.slug, hasDayWiseItinerary]);


  const toggleItineraryDay = (index: number) => {
    setExpandedItineraryDays((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  };

  const expandAllItineraryDays = () => {
    setExpandedItineraryDays(
      expandedItineraryDays.length === dayWiseItinerary.length
        ? []
        : dayWiseItinerary.map((_, index) => index)
    );
  };

  const buildDownloadableItinerary = () => {
    const lines: string[] = [
      trip.title,
      trip.subtitle || "",
      "",
      `Duration: ${displayDuration}`,
      trip.startPoint ? `Start point: ${trip.startPoint}` : "",
      trip.destination ? `Destination: ${trip.destination}` : "",
      "",
      "ITINERARY",
      "",
    ].filter(Boolean);

    if (hasDayWiseItinerary) {
      dayWiseItinerary.forEach((day, index) => {
        lines.push(
          `DAY ${day.day || index + 1}: ${day.title}`,
          day.location ? `Location: ${day.location}` : "",
          day.description,
          ...(day.highlights?.length
            ? ["Highlights:", ...day.highlights.map((item) => `- ${item}`)]
            : []),
          ""
        );
      });
    } else {
      itinerary.forEach((item, index) => {
        if (typeof item === "string") {
          lines.push(`${index + 1}. ${item}`);
          return;
        }

        if ("activity" in item) {
          lines.push(
            `${item.time ? `${item.time} - ` : ""}${item.activity}`
          );
        }
      });
    }

    return lines.filter((line) => line !== undefined).join("\n");
  };

  const downloadItinerary = async () => {
    if (isDownloadingPdf) return;

    setIsDownloadingPdf(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 15;
      const contentWidth = pageWidth - marginX * 2;
      const footerHeight = 18;
      const bottomLimit = pageHeight - footerHeight - 8;

      const dark = [23, 37, 29] as const;
      const orange = [242, 140, 40] as const;
      const muted = [93, 104, 98] as const;
      const soft = [247, 245, 242] as const;
      const lightBorder = [224, 226, 224] as const;

      const logoData = await pdfAssetToDataUrl(pdfLogo);

      const addFooter = () => {
        pdf.setDrawColor(...lightBorder);
        pdf.line(marginX, pageHeight - footerHeight, pageWidth - marginX, pageHeight - footerHeight);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...dark);
        pdf.text("Bucketlist Adventure", marginX, pageHeight - 11);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...muted);
        pdf.text(
          "WhatsApp: +91 92255 31257  |  Contact: +91 84828 46287",
          marginX,
          pageHeight - 7
        );

        pdf.text(
          "bucketlistdestinations2@gmail.com  |  bucketlistadventure.in",
          marginX,
          pageHeight - 3.5
        );

        pdf.setFontSize(7);
        pdf.text(
          `${pdf.getCurrentPageInfo().pageNumber}`,
          pageWidth - marginX,
          pageHeight - 3.5,
          { align: "right" }
        );
      };

      const addBrandHeader = () => {
        if (logoData) {
          try {
            pdf.addImage(
              logoData,
              pdfImageFormat(logoData),
              marginX,
              12,
              32,
              17,
              undefined,
              "FAST"
            );
          } catch {
            // Continue without logo if the browser/PDF engine cannot decode it.
          }
        }

        const brandX = logoData ? marginX + 38 : marginX;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(...orange);
        pdf.text("BUCKETLIST ADVENTURE", brandX, 18);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(...dark);
        pdf.text("We Plan It. You Live It.", brandX, 23);

        const contactX = pageWidth - marginX;

        pdf.setFontSize(7.4);
        pdf.setTextColor(...dark);
        pdf.text("+91 92255 31257", contactX, 14, { align: "right" });
        pdf.text("+91 84828 46287", contactX, 18, { align: "right" });
        pdf.text("bucketlistdestinations2@gmail.com", contactX, 22, {
          align: "right",
        });
        pdf.text("bucketlistadventure.in", contactX, 26, { align: "right" });

        pdf.setDrawColor(...lightBorder);
        pdf.line(marginX, 32, pageWidth - marginX, 32);
      };

      const addNewPage = () => {
        addFooter();
        pdf.addPage();
        addBrandHeader();
        return 39;
      };

      addBrandHeader();

      let y = 43;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(...dark);
      pdf.text(trip.title, marginX, y);
      y += 8;

      if (trip.subtitle) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...muted);

        const subtitleLines = pdf.splitTextToSize(trip.subtitle, contentWidth);
        pdf.text(subtitleLines, marginX, y);
        y += subtitleLines.length * 5 + 4;
      }

      const metaItems = [
        displayDuration ? `Duration: ${displayDuration}` : "",
        trip.destination ? `Destination: ${trip.destination}` : "",
        trip.startPoint ? `Start point: ${trip.startPoint}` : "",
      ].filter(Boolean);

      if (metaItems.length) {
        pdf.setFillColor(...soft);
        pdf.roundedRect(marginX, y, contentWidth, 12, 3, 3, "F");

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.2);
        pdf.setTextColor(...dark);
        pdf.text(metaItems.join("   •   "), marginX + 4, y + 7.2);

        y += 17;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...orange);
      pdf.text("ITINERARY", marginX, y);
      y += 7;

      if (hasDayWiseItinerary) {
        for (let index = 0; index < dayWiseItinerary.length; index += 1) {
          const day = dayWiseItinerary[index];

          const dayTitle = `DAY ${day.day || index + 1}  •  ${day.title}`;
          const titleLines = pdf.splitTextToSize(dayTitle, contentWidth - 8);

          const descriptionLines = pdf.splitTextToSize(
            day.description || "",
            contentWidth - 8
          );

          const highlights = day.highlights || [];
          const highlightLines = highlights.flatMap((highlight) =>
            pdf
              .splitTextToSize(`• ${highlight}`, contentWidth - 12)
              .map((line: string) => line)
          );

          const imageData = day.image
            ? await pdfAssetToDataUrl(day.image)
            : null;

          const imageHeight = imageData ? 44 : 0;

          const cardHeight =
            13 +
            titleLines.length * 5 +
            (day.location ? 5 : 0) +
            Math.max(descriptionLines.length * 4.5, imageHeight) +
            (highlightLines.length ? highlightLines.length * 4 + 7 : 0) +
            9;

          if (y + cardHeight > bottomLimit) {
            y = addNewPage();
          }

          const cardTop = y;

          pdf.setDrawColor(...lightBorder);
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(marginX, cardTop, contentWidth, cardHeight, 4, 4, "FD");

          pdf.setFillColor(...dark);
          pdf.roundedRect(marginX + 4, cardTop + 5, 18, 18, 3, 3, "F");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(6.5);
          pdf.setTextColor(255, 255, 255);
          pdf.text("DAY", marginX + 13, cardTop + 10, { align: "center" });

          pdf.setFontSize(12);
          pdf.text(
            String(day.day || index + 1),
            marginX + 13,
            cardTop + 18,
            { align: "center" }
          );

          const textX = marginX + 27;
          const textWidth = imageData ? contentWidth - 27 - 58 : contentWidth - 31;

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11.5);
          pdf.setTextColor(...dark);

          const visibleTitleLines = pdf.splitTextToSize(
            day.title,
            textWidth
          );

          pdf.text(visibleTitleLines, textX, cardTop + 9);

          let innerY = cardTop + 9 + visibleTitleLines.length * 5;

          if (day.location) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.8);
            pdf.setTextColor(...orange);
            pdf.text(day.location, textX, innerY + 1);
            innerY += 6;
          }

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.4);
          pdf.setTextColor(...muted);

          const bodyWidth = imageData ? textWidth : contentWidth - 35;
          const bodyLines = pdf.splitTextToSize(
            day.description || "",
            bodyWidth
          );

          pdf.text(bodyLines, textX, innerY + 2);

          if (imageData) {
            try {
              pdf.addImage(
                imageData,
                pdfImageFormat(imageData),
                pageWidth - marginX - 54,
                cardTop + 8,
                50,
                44,
                undefined,
                "FAST"
              );
            } catch {
              // Continue if a remote day image cannot be embedded.
            }
          }

          const bodyBottom =
            innerY +
            2 +
            bodyLines.length * 4.5;

          let highlightsY = Math.max(bodyBottom + 5, cardTop + 57);

          if (highlights.length) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(7.5);
            pdf.setTextColor(...dark);
            pdf.text("Highlights", textX, highlightsY);
            highlightsY += 4.5;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.7);
            pdf.setTextColor(...muted);

            const highlightText = highlights
              .map((highlight) => `• ${highlight}`)
              .join("   ");

            const wrappedHighlights = pdf.splitTextToSize(
              highlightText,
              contentWidth - 31
            );

            pdf.text(wrappedHighlights, textX, highlightsY);
          }

          y = cardTop + cardHeight + 5;
        }
      } else {
        for (let index = 0; index < itinerary.length; index += 1) {
          const item = itinerary[index];

          let line = "";

          if (typeof item === "string") {
            line = item;
          } else if ("activity" in item) {
            line = `${item.time ? `${item.time} - ` : ""}${item.activity}`;
          }

          if (!line.trim()) continue;

          const lines = pdf.splitTextToSize(line, contentWidth - 16);
          const rowHeight = Math.max(12, lines.length * 4.5 + 6);

          if (y + rowHeight > bottomLimit) {
            y = addNewPage();
          }

          pdf.setFillColor(...soft);
          pdf.roundedRect(marginX, y, contentWidth, rowHeight, 3, 3, "F");

          pdf.setFillColor(...dark);
          pdf.circle(marginX + 6, y + rowHeight / 2, 3, "F");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(6.5);
          pdf.setTextColor(255, 255, 255);
          pdf.text(String(index + 1), marginX + 6, y + rowHeight / 2 + 2, {
            align: "center",
          });

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(...dark);
          pdf.text(lines, marginX + 12, y + 5);

          y += rowHeight + 3;
        }
      }

      if (includes.length || excludes.length) {
        const sectionTop = y + 3;

        if (sectionTop + 45 > bottomLimit) {
          y = addNewPage();
        } else {
          y = sectionTop;
        }

        const columnGap = 5;
        const columnWidth = (contentWidth - columnGap) / 2;

        const drawListSection = (
          title: string,
          items: string[],
          x: number,
          marker: string,
          markerColor: readonly [number, number, number]
        ) => {
          const wrappedItems = items.map((item) =>
            pdf.splitTextToSize(item, columnWidth - 12)
          );

          const boxHeight = Math.max(
            30,
            14 +
              wrappedItems.reduce(
                (sum, lines) => sum + lines.length * 4.1 + 2,
                0
              )
          );

          pdf.setDrawColor(...lightBorder);
          pdf.roundedRect(x, y, columnWidth, boxHeight, 4, 4, "D");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(...orange);
          pdf.text(title, x + 5, y + 8);

          let itemY = y + 15;

          wrappedItems.forEach((lines) => {
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(...markerColor);
            pdf.setFontSize(8);
            pdf.text(marker, x + 5, itemY);

            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(...dark);
            pdf.setFontSize(7.8);
            pdf.text(lines, x + 10, itemY);

            itemY += lines.length * 4.1 + 2;
          });

          return boxHeight;
        };

        const leftHeight = drawListSection(
          "INCLUDED",
          includes,
          marginX,
          "✓",
          [27, 122, 71] as const
        );

        const rightHeight = drawListSection(
          "NOT INCLUDED",
          excludes,
          marginX + columnWidth + columnGap,
          "–",
          [190, 38, 38] as const
        );

        y += Math.max(leftHeight, rightHeight) + 6;
      }

      addFooter();

      pdf.save(
        `${safePdfFileName(trip.title)}-Itinerary-Bucketlist-Adventure.pdf`
      );
    } catch (error) {
      console.error("Could not generate itinerary PDF:", error);
      alert(
        "We could not generate the itinerary PDF right now. Please try again."
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };


  return (
    <main ref={pageRef} className="min-h-screen bg-[#f5f3ee] text-[#17251d]">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">

        {/* Back */}
        <Link
          href="/"
          data-trip-back
          className="mb-8 inline-flex items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
        >
          ← Back to home
        </Link>

        {/* HERO */}
        <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">

            <div
              data-trip-hero-image
              className="min-h-[380px] bg-cover bg-center"
              style={{
                backgroundImage: `url('${primaryImage || trip.image}')`,
              }}
            />

            <div data-trip-hero-copy className="p-8 lg:p-10">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                {trip.startPoint}
              </p>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {trip.title}
              </h1>

              <p className="mt-3 text-lg text-[#5d6862]">
                {trip.subtitle}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-[#17251d]">

                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                    From
                  </p>

                  <p className="mt-2 font-semibold">
                    {currentPrice
                      ? formatPrice(currentPrice)
                      : trip.price || "On request"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                    Duration
                  </p>

                  <p className="mt-2 font-semibold">
                    {displayDuration}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                    Next departure
                  </p>

                  <p className="mt-2 font-semibold">
                      {displayBatch
                      ? formatDate(displayBatch.departureDate)
                      : "On request"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f5f2] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                    Difficulty
                  </p>

                  <p className="mt-2 font-semibold">
                    {trip.difficulty}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleBookNow}
                  disabled={!selectedBatch || !isEnoughSeats}
                  className="inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Book Now
                </button>

                <a
                  href={`https://wa.me/918482846287?text=${encodeURIComponent(
                    `Hi Bucketlist Adventure, I'm interested in ${
                      trip.title
                    }${
                      selectedBatch
                        ? ` for ${formatDate(selectedBatch.departureDate)}`
                        : ""
                    }. We are ${travelerCount} traveler(s). Please share the details.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[#17251d]/15 bg-white px-6 py-4 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
                >
                  Enquire on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* GALLERY */}
        {gallery.length > 0 && (
          <div data-trip-reveal className="mt-10 rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Photo gallery
              </p>

              <span className="text-sm text-[#5d6862]">
                {gallery.length} images
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_0.7fr]">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="overflow-hidden rounded-[24px] border border-black/10 bg-[#f7f5f2] text-left"
              >
                <div
                  className="h-[420px] w-full bg-cover bg-center transition duration-300 hover:scale-[1.01]"
                  style={{
                    backgroundImage: `url('${primaryImage}')`,
                  }}
                />
              </button>

              <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-[18px] border transition ${
                      primaryImage === image
                        ? "border-orange-500 ring-2 ring-orange-200"
                        : "border-black/10"
                    }`}
                  >
                    <div className="h-28 w-full overflow-hidden bg-[#f7f5f2]">
                      <img
                        src={image}
                        alt={`${trip.title} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX */}
        {isLightboxOpen && primaryImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#101712]/80 p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1411] shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/85 px-3 py-2 text-sm font-semibold text-[#17251d]"
              >
                Close
              </button>

              <div className="flex h-[75vh] w-full items-center justify-center bg-[#0d1411]">
                <img
                  src={primaryImage}
                  alt={`${trip.title} full size`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {hasDayWiseItinerary && (
          <section data-trip-reveal className="mt-12 overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-5 border-b border-black/10 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#17251d] p-2 sm:h-24 sm:w-40">
                  <img
                    src={brandLogo}
                    alt="Bucketlist Adventure"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                    Itinerary
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#5d6862]">
                    Day-wise plan with key highlights, stays and experiences.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5d6862]">
                    <span><strong className="text-[#17251d]">WhatsApp:</strong> +91 92255 31257</span>
                    <span><strong className="text-[#17251d]">Contact:</strong> +91 84828 46287</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadItinerary}
                  disabled={isDownloadingPdf}
                  className="rounded-full border border-[#17251d]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white disabled:cursor-wait disabled:opacity-60"
                >
                  {isDownloadingPdf ? "Preparing PDF..." : "↓ Download PDF"}
                </button>

                
                <button
                  type="button"
                  onClick={expandAllItineraryDays}
                  className="rounded-full border border-[#17251d]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
                >
                  {expandedItineraryDays.length === dayWiseItinerary.length
                    ? "Collapse all"
                    : "Expand all days"}
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-6 lg:p-8">
              {dayWiseItinerary.map((day, index) => {
                const expanded = expandedItineraryDays.includes(index);

                return (
                  <article
                    key={`day-${day.day}-${index}`}
                    data-itinerary-card
                    className="overflow-hidden rounded-[24px] border border-black/10 bg-[#f7f5f2]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleItineraryDay(index)}
                      className="grid w-full gap-4 p-4 text-left sm:grid-cols-[70px_1fr_auto] sm:items-center sm:p-5"
                    >
                      <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-[#17251d] text-white">
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">
                          Day
                        </span>
                        <span className="text-xl font-bold">
                          {day.day || index + 1}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-lg font-bold text-[#17251d] sm:text-xl">
                            {day.title}
                          </h3>

                          {day.location && (
                            <span className="text-xs font-semibold text-green-700">
                              ● {day.location}
                            </span>
                          )}
                        </div>

                        {day.highlights?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {day.highlights.slice(0, 5).map((highlight) => (
                              <span
                                key={highlight}
                                className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#5d6862]"
                              >
                                {highlight}
                              </span>
                            ))}
                            {day.highlights.length > 5 && (
                              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#5d6862]">
                                +{day.highlights.length - 5} more
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <span className="text-xs font-bold text-green-700">
                        {expanded ? "See less ↑" : "See more ↓"}
                      </span>
                    </button>

                    {expanded && (
                      <div className="border-t border-black/10 bg-white p-5 sm:p-7 lg:p-8">
                        <div
                          className={`grid gap-7 ${
                            day.image
                              ? "lg:grid-cols-[1.05fr_0.95fr] lg:items-start"
                              : ""
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
                              Day {day.day || index + 1}
                            </p>

                            <h4 className="mt-2 text-2xl font-bold text-[#17251d] sm:text-3xl">
                              {day.title}
                            </h4>

                            <p className="mt-4 whitespace-pre-line text-base leading-7 text-[#5d6862]">
                              {day.description}
                            </p>

                            {day.highlights?.length ? (
                              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {day.highlights.map((highlight) => (
                                  <div
                                    key={highlight}
                                    className="flex items-start gap-2 rounded-xl bg-[#f7f5f2] px-3 py-2.5"
                                  >
                                    <span className="mt-0.5 text-green-700">✓</span>
                                    <span className="text-sm font-medium leading-5 text-[#17251d]">
                                      {highlight}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          {day.image ? (
                            <div className="overflow-hidden rounded-[22px] border border-black/10 bg-[#f7f5f2]">
                              <img
                                src={day.image}
                                alt={`${trip.title} - Day ${day.day || index + 1}`}
                                className="h-72 w-full object-cover sm:h-80 lg:h-[360px]"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {hasDayWiseItinerary && routeStops.length > 0 && (
          <section
            data-trip-reveal
            className="mt-8 overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.04)]"
          >
            <div className="flex flex-col gap-5 border-b border-black/10 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Trip route
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17251d] sm:text-3xl">
                  Your journey at a glance
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d6862]">
                  Automatically created from the locations in the day-wise itinerary.
                </p>
              </div>

              {googleMapsRouteUrl && (
                <a
                  href={googleMapsRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
                >
                  Open route in Google Maps ↗
                </a>
              )}
            </div>

            <div className="p-5 sm:p-8">
              <div className="overflow-x-auto pb-2">
                <div
                  className="relative flex min-w-max items-start px-3 py-7"
                  style={{
                    width: `${Math.max(routeStops.length * 190, 720)}px`,
                  }}
                >
                  <div
                    className="absolute left-[94px] right-[94px] top-[45px] h-[3px] rounded-full bg-[#17251d]/15"
                    aria-hidden="true"
                  />

                  {routeStops.map((stop, index) => (
                    <div
                      key={`${stop.day}-${stop.location}-${index}`}
                      className="relative z-10 flex w-[190px] shrink-0 flex-col items-center px-3 text-center"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-[5px] border-[#f5f3ee] bg-[#17251d] text-xs font-bold text-white shadow-sm">
                        {index + 1}
                      </div>

                      <span className="mt-4 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-600">
                        Day {stop.day}
                      </span>

                      <h3 className="mt-2 max-w-[165px] text-sm font-bold leading-5 text-[#17251d]">
                        {stop.location}
                      </h3>

                      <p className="mt-1 max-w-[165px] text-xs leading-5 text-[#5d6862]">
                        {stop.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-[#f7f5f2] px-4 py-3 text-xs leading-5 text-[#5d6862] sm:text-sm">
                Route shown here is an itinerary overview. Actual roads, transfers and stop
                order may vary based on local conditions and the final operating plan.
              </div>
            </div>
          </section>
        )}

        {hasDayWiseItinerary && (
          <div data-trip-reveal className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-black/10 bg-white p-7">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Included
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 rounded-2xl bg-[#f7f5f2] p-3"
                  >
                    <span className="mt-1 text-green-700">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white p-7">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Not included
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {excludes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 rounded-2xl bg-[#f7f5f2] p-3"
                  >
                    <span className="mt-1 text-red-500">–</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div data-trip-reveal className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">

          <div className="space-y-8">

            {/* Overview */}
            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Overview
              </p>

              <p className="text-lg leading-8 text-[#5d6862] whitespace-pre-line">
                {overview}
              </p>

              {!hasDayWiseItinerary && (
                <div className="mt-10">
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                        Itinerary
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={downloadItinerary}
                        disabled={isDownloadingPdf}
                        className="rounded-full border border-[#17251d]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white disabled:cursor-wait disabled:opacity-60"
                      >
                        {isDownloadingPdf ? "Preparing PDF..." : "↓ Download PDF"}
                      </button>

                      
                    </div>
                  </div>

                  <div className="space-y-4">
                    {itinerary.map((item, index) => {
                      const isStructured =
                        typeof item !== "string" && "activity" in item;
                      const time = isStructured
                        ? item.time?.trim() || ""
                        : "";
                      const activity =
                        typeof item === "string"
                          ? item.trim()
                          : isStructured
                            ? item.activity?.trim() || ""
                            : "";
                      const isDayHeading =
                        !time && /^day\s*\d+/i.test(activity);

                      if (!activity) return null;

                      if (isDayHeading) {
                        return (
                          <div
                            key={`${activity}-${index}`}
                            className="pt-3 first:pt-0"
                          >
                            <div className="flex items-center gap-3">
                              <span className="h-px flex-1 bg-[#17251d]/10" />
                              <p className="shrink-0 text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
                                {activity}
                              </p>
                              <span className="h-px flex-1 bg-[#17251d]/10" />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${activity}-${index}`}
                          className="grid gap-3 rounded-2xl bg-[#f7f5f2] p-4 sm:grid-cols-[120px_1fr] sm:items-center"
                        >
                          <div>
                            {time ? (
                              <span className="inline-flex rounded-full bg-[#17251d] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                                {time}
                              </span>
                            ) : (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#17251d] text-xs font-bold text-white">
                                {index + 1}
                              </span>
                            )}
                          </div>

                          <p className="text-base font-medium leading-6 text-[#17251d]">
                            {activity}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pickup */}
            {pickupPoints.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Pickup Points
                </p>

                <ul className="space-y-2 text-[#17251d]">
                  {pickupPoints.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="rounded-2xl bg-[#f7f5f2] p-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Things to carry */}
            {thingsToCarry.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Things to Carry
                </p>

                <ul className="space-y-2 text-[#17251d]">
                  {thingsToCarry.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-start gap-2 rounded-2xl bg-[#f7f5f2] p-3"
                    >
                      <span className="mt-1 text-orange-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Medical */}
            {medicalDisclaimer.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Medical Disclaimer
                </p>

                <ul className="space-y-2 text-[#17251d]">
                  {medicalDisclaimer.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="rounded-2xl bg-[#f7f5f2] p-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rules */}
            {rules.length > 0 && (
              <div className="rounded-[28px] border border-black/10 bg-white p-8">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Rules
                </p>

                <ul className="space-y-2 text-[#17251d]">
                  {rules.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-start gap-2 rounded-2xl bg-[#f7f5f2] p-3"
                    >
                      <span className="mt-1 text-red-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">

            {/* BOOKING CARD */}
            <div
              id="booking-form"
              className="rounded-[28px] border border-black/10 bg-[#17251d] p-8 text-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-300">
                Book your adventure
              </p>

              <h3 className="text-4xl font-bold">
                {currentPrice
                  ? formatPrice(currentPrice)
                  : trip.price || "On request"}
              </h3>

              <p className="mt-2 text-sm text-white/60">
                per person
              </p>

              {/* BATCH SELECTION */}
              {availableBatches.length > 0 ? (
                <div className="mt-7">
                  <p className="mb-3 text-sm font-semibold text-white">
                    Select departure
                  </p>

                  <div className="space-y-3">
                    {availableBatches.map((batch) => {
                      const selected = batch.id === selectedBatchId;

                      return (
                        <button
                          key={batch.id}
                          type="button"
                          onClick={() =>
                            setSelectedBatchId(batch.id)
                          }
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-orange-400 bg-orange-400/15"
                              : "border-white/10 bg-white/5 hover:border-white/30"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-white">
                                {formatDate(batch.departureDate)}
                              </p>

                              {batch.returnDate !==
                                batch.departureDate && (
                                <p className="mt-1 text-xs text-white/60">
                                  Returns{" "}
                                  {formatDate(batch.returnDate)}
                                </p>
                              )}
                            </div>

                            <p className="font-bold text-orange-300">
                              {formatPrice(batch.price)}
                            </p>
                          </div>

                          <p className="mt-2 text-xs text-white/60">
                            {Math.max(
                              0,
                              batch.totalSeats - (batch.bookedSeats || 0)
                            )}{" "}
                            seats available
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-white/70">
                  No public departures are currently available.
                  Contact us for upcoming dates.
                </div>
              )}

              {/* TRAVELERS */}
              <div className="mt-6">
                <label className="text-sm font-semibold text-white">
                  Number of travelers
                </label>

                <input
                  type="number"
                  min="1"
                  max={availableSeats ?? undefined}
                  value={booking.travelers}
                  onChange={(event) =>
                    setBooking((current) => ({
                      ...current,
                      travelers: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-orange-400"
                />
              </div>

              {/* TOTAL */}
              {selectedBatch && (
                <div className="mt-5 rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>
                      {formatPrice(selectedBatch.price)} ×{" "}
                      {travelerCount}
                    </span>

                    <span className="text-lg font-bold text-white">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>

                  {selectedBatch.paymentMode === "ADVANCE" && (
                    <p className="mt-2 text-xs text-orange-300">
                      Advance required:{" "}
                      {formatPrice(
                        selectedBatch.advanceAmount *
                          travelerCount
                      )}
                    </p>
                  )}
                </div>
              )}

              {!isEnoughSeats && (
                <p className="mt-3 text-sm font-semibold text-red-300">
                  Only {availableSeats} seats are available for this
                  departure.
                </p>
              )}

              {/* BOOK NOW */}
              <button
                type="button"
                onClick={handleBookNow}
                disabled={
                  !selectedBatch ||
                  !isEnoughSeats ||
                  !selectedBatch.bookingEnabled
                }
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Book Now
              </button>

              {/* WHATSAPP */}
              <a
                href={`https://wa.me/918482846287?text=${encodeURIComponent(
                  `Hi Bucketlist Adventure, I'm interested in ${
                    trip.title
                  }${
                    selectedBatch
                      ? ` for ${formatDate(
                          selectedBatch.departureDate
                        )}`
                      : ""
                  }. We are ${travelerCount} traveler(s). Please share the details.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#17251d]"
              >
                Enquire on WhatsApp
              </a>

              {/* Summary */}
              <div className="mt-6 space-y-3 text-sm text-white/80">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Duration</span>

                  <span className="font-semibold text-white">
                    {displayDuration}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Difficulty</span>

                  <span className="font-semibold text-white">
                    {trip.difficulty}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span>Seats</span>

                  <span className="font-semibold text-white">
                   {displayAvailableSeats !== null
                   ? `${displayAvailableSeats} available`
                   : trip.seats || "On request"}
                   </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Group size</span>

                  <span className="font-semibold text-white">
                    {trip.groupSize || "Flexible"}
                  </span>
                </div>
              </div>
            </div>

            {/* INCLUDED */}
            {!hasDayWiseItinerary && (
            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Included
              </p>

              <ul className="space-y-3 text-[#17251d]">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 text-orange-500">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            )}

            {/* NOT INCLUDED */}
            {!hasDayWiseItinerary && (
            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Not included
              </p>

              <ul className="space-y-3 text-[#17251d]">
                {excludes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 text-red-500">–</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            )}

            {/* WHATSAPP FORM */}
            <div className="rounded-[28px] border border-black/10 bg-white p-8">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                Need help?
              </p>

              <p className="mb-5 text-sm leading-6 text-[#5d6862]">
                Not ready to book online? Send us your details and our
                team will help you plan the trip.
              </p>

              <form onSubmit={submitBooking} className="space-y-4">

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Name</span>

                  <input
                    required
                    value={booking.name}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Your full name"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Phone</span>

                  <input
                    required
                    value={booking.phone}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="Your phone number"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Travelers</span>

                  <input
                    type="number"
                    min="1"
                    value={booking.travelers}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        travelers: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Message</span>

                  <textarea
                    value={booking.message}
                    onChange={(event) =>
                      setBooking((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#17251d] px-5 py-4 text-sm font-semibold text-white transition hover:bg-orange-500"
                >
                  Send enquiry on WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* TRIP FAQS */}
        {faqs.length > 0 && (
          <section
            data-trip-reveal
            aria-labelledby="trip-faq-heading"
            className="mt-16 overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.04)]"
          >
            <div className="grid gap-8 border-b border-black/10 p-8 lg:grid-cols-[0.75fr_1.25fr] lg:p-10">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                  Good to know
                </p>

                <h2
                  id="trip-faq-heading"
                  className="mt-4 text-3xl font-bold tracking-tight text-[#17251d] sm:text-4xl"
                >
                  Frequently asked questions
                </h2>

                <p className="mt-4 max-w-md text-sm leading-7 text-[#5d6862]">
                  Quick answers about {trip.title}, based on the current trip
                  details, available departures and booking information.
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <details
                    key={`${faq.question}-${index}`}
                    className="group rounded-[22px] border border-black/10 bg-[#f7f5f2] px-5 py-4"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-5 font-semibold text-[#17251d]">
                      <span>{faq.question}</span>

                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-lg leading-none text-[#17251d] transition group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>

                    <p className="mt-4 border-t border-black/10 pt-4 text-sm leading-7 text-[#5d6862]">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-[#17251d] px-8 py-6 text-white sm:flex-row sm:items-center sm:justify-between lg:px-10">
              <p className="text-sm leading-6 text-white/70">
                Still have a question about this adventure?
              </p>

              <a
                href={`https://wa.me/918482846287?text=${encodeURIComponent(
                  `Hi Bucketlist Adventure, I have a question about ${trip.title}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
              >
                Ask us on WhatsApp ↗
              </a>
            </div>
          </section>
        )}

        {/* SIMILAR TRIPS */}
        <div data-trip-reveal className="mt-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
                More adventures
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Similar trips
              </h2>
            </div>

            <Link
              href="/trips"
              className="text-sm font-semibold text-[#17251d] underline decoration-[#17251d]/40 underline-offset-4"
            >
              View all trips
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {defaultTrips
              .filter((item: TripData) => item.slug !== trip.slug)
              .slice(0, 3)
              .map((item: TripData) => {
                const nextBatch = item.batches
  ?.filter(
    (batch) =>
      batch.visibility === "PUBLIC" &&
      batch.status === "OPEN" &&
      batch.bookingEnabled &&
      batch.totalSeats - (batch.bookedSeats || 0) > 0
  )
  .sort(
    (a, b) =>
      new Date(a.departureDate).getTime() -
      new Date(b.departureDate).getTime()
  )[0];

                return (
                  <Link
                    key={item.slug}
                    href={`/trips/${item.slug}`}
                    className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1"
                  >
                    <div
                      className="h-44 bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${item.image}')`,
                      }}
                    />

                    <div className="p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#17251d]/60">
                        {item.startPoint}
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-[#17251d]">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[#5d6862]">
                        {item.summary}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-black/10 pt-4">
                        <span className="font-semibold text-[#17251d]">
                          {nextBatch
                            ? formatPrice(nextBatch.price)
                            : item.price || "On request"}
                        </span>

                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                          View
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </main>
  );
}