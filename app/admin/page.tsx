"use client";

import CouponManager from "./components/CouponManager";
import { useEffect, useState } from "react";
import {
  defaultTrips,
  travelCategories,
  type DayWiseItineraryItem,
  type ItineraryFormat,
  type TripBatch,
  type TripCategory,
  type TripData,
  type TravelCategory,
} from "../data/trips";



const createSlug = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uploadTripImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/images", {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.url) {
    throw new Error(data?.error || "Image upload failed.");
  }

  return String(data.url);
};

const isDayWiseItineraryItem = (
  entry: TripData["itinerary"][number]
): entry is DayWiseItineraryItem =>
  typeof entry !== "string" &&
  "title" in entry &&
  "description" in entry;

const inferItineraryFormat = (trip: TripData): ItineraryFormat =>
  (trip.itinerary || []).some(isDayWiseItineraryItem)
    ? "DAY_WISE"
    : "TIMED";

export default function AdminPage() {
  const [trips, setTrips] = useState<TripData[]>(defaultTrips);
  const [selectedSlug, setSelectedSlug] = useState(defaultTrips[0]?.slug ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [siteSynced, setSiteSynced] = useState(true);
  const [adminSection, setAdminSection] = useState<"TRIPS" | "COUPONS">("TRIPS");
  const [newTripSlugs, setNewTripSlugs] = useState<string[]>([]);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);
  const [itineraryFormatOverrides, setItineraryFormatOverrides] = useState<Record<string, ItineraryFormat>>({});

  const trip = trips.find((item) => item.slug === selectedSlug) ?? trips[0] ?? defaultTrips[0];
  const itineraryFormat = itineraryFormatOverrides[selectedSlug] ?? inferItineraryFormat(trip);

  const syncSelectedTrip = (nextTrips: TripData[]) => {
    if (!nextTrips.length) return;

    setTrips(nextTrips);
    setSelectedSlug((current) =>
      nextTrips.some((item) => item.slug === current) ? current : nextTrips[0].slug
    );
  };

  useEffect(() => {
    const fetchTrips = async () => {
      const response = await fetch("/api/trips", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        syncSelectedTrip(data);
      } else {
        syncSelectedTrip(defaultTrips);
      }
    };

    fetchTrips();
  }, []);

  const updateField = (field: keyof TripData, value: string) => {
    setStatus(null);
    setSiteSynced(false);
    setTrips((current) =>
      current.map((item) =>
        item.slug === selectedSlug ? { ...item, [field]: value } : item
      )
    );
  };

  const updateTripTitle = (value: string) => {
    setStatus(null);
    setSiteSynced(false);

    const currentTrip = trips.find(
      (item) => item.slug === selectedSlug
    );

    if (!currentTrip) return;

    const isNewTrip =
      currentTrip.slug.startsWith("new-trip-") ||
      newTripSlugs.includes(currentTrip.slug);

    /*
     * Existing published trips may have their visible title renamed,
     * but their existing public URL stays unchanged.
     */
    if (!isNewTrip) {
      setTrips((current) =>
        current.map((item) =>
          item.slug === selectedSlug
            ? {
                ...item,
                title: value,
              }
            : item
        )
      );

      return;
    }

    /*
     * New trips keep generating their URL from the title until
     * the trip is saved for the first time.
     */
    const generatedSlug = createSlug(value);
    const nextSlug = generatedSlug || currentTrip.slug;

    setTrips((current) =>
      current.map((item) =>
        item.slug === selectedSlug
          ? {
              ...item,
              title: value,
              slug: nextSlug,
            }
          : item
      )
    );

    setNewTripSlugs((current) => {
      const withoutPreviousSlug = current.filter(
        (slug) => slug !== selectedSlug
      );

      return Array.from(
        new Set([
          ...withoutPreviousSlug,
          nextSlug,
        ])
      );
    });

    if (nextSlug !== selectedSlug) {
      setSelectedSlug(nextSlug);
    }
  };

  const updateBatch = (
  batchId: string,
  field: keyof TripBatch,
  value: string | number | boolean
) => {
  setStatus(null);
  setSiteSynced(false);

  setTrips((current) =>
    current.map((item) => {
      if (item.slug !== selectedSlug) {
        return item;
      }

      return {
        ...item,
        batches: (item.batches || []).map((batch) =>
          batch.id === batchId
            ? {
                ...batch,
                [field]: value,
              }
            : batch
        ),
      };
    })
  );
};

const addBatch = () => {
  const batchId = `${trip.slug}-${Date.now()}`;

  const newBatch: TripBatch = {
    id: batchId,

    departureDate: "",
    returnDate: "",

    price: 0,

    totalSeats: 20,
    bookedSeats: 0,

    paymentMode: "FULL",
    advanceAmount: 0,

    status: "DRAFT",
    visibility: "PUBLIC",

    bookingEnabled: false,
  };

  setSiteSynced(false);
  setStatus(null);

  setTrips((current) =>
    current.map((item) =>
      item.slug === selectedSlug
        ? {
            ...item,
            batches: [...(item.batches || []), newBatch],
          }
        : item
    )
  );

  setStatus({
    type: "success",
    message: "New departure added. Complete the details and save changes.",
  });
};

const deleteBatch = (batchId: string) => {
  const batch = trip.batches?.find((item) => item.id === batchId);

  if (!batch) {
    return;
  }

  const confirmed = window.confirm(
    `Delete departure ${
      batch.departureDate || "without a date"
    } from ${trip.title}?`
  );

  if (!confirmed) {
    return;
  }

  setSiteSynced(false);

  setTrips((current) =>
    current.map((item) =>
      item.slug === selectedSlug
        ? {
            ...item,
            batches: (item.batches || []).filter(
              (batchItem) => batchItem.id !== batchId
            ),
          }
        : item
    )
  );

  setStatus({
    type: "success",
    message: "Departure removed. Save changes to persist it.",
  });
};

  const setMainImage = (imageUrl: string) => {
    setSiteSynced(false);
    setTrips((current) =>
      current.map((item) =>
        item.slug === selectedSlug ? { ...item, image: imageUrl } : item
      )
    );
    setStatus({ type: "success", message: "Main trip image updated." });
  };

  const setFeatured = () => {
    setSiteSynced(false);
    setTrips((current) =>
      current.map((item) =>
        item.slug === selectedSlug
          ? { ...item, featured: true }
          : { ...item, featured: false }
      )
    );
    setStatus({ type: "success", message: "Featured trip updated." });
  };

  const removeGalleryImage = (imageUrl: string) => {
    setSiteSynced(false);
    setTrips((current) =>
      current.map((item) => {
        if (item.slug !== selectedSlug) return item;
        const nextGallery = (item.gallery || []).filter((image) => image !== imageUrl);
        const nextImage = item.image === imageUrl ? nextGallery[0] || item.image : item.image;
        return {
          ...item,
          image: nextImage,
          gallery: nextGallery,
        };
      })
    );
    setStatus({ type: "success", message: "Gallery image removed." });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadTripImage(file);
      setSiteSynced(false);
      setTrips((current) =>
        current.map((item) =>
          item.slug === selectedSlug
            ? {
                ...item,
                image: imageUrl,
                gallery: Array.from(
                  new Set([
                    imageUrl,
                    ...(item.gallery || []).filter(
                      (image) => !image.startsWith("data:image")
                    ),
                  ])
                ),
              }
            : item
        )
      );
      setStatus({ type: "success", message: "Main image uploaded. Save changes to publish it." });
      setError("");
    } catch {
      setError("Could not upload the image. Please try another file.");
    }

    event.target.value = "";
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const uploaded = await Promise.all(files.map((file) => uploadTripImage(file)));
      setSiteSynced(false);
      setTrips((current) =>
        current.map((item) =>
          item.slug === selectedSlug
            ? {
                ...item,
                image: item.image || uploaded[0] || item.image,
                gallery: Array.from(new Set([...(item.gallery || []), ...uploaded])),
              }
            : item
        )
      );
      setStatus({ type: "success", message: `${uploaded.length} gallery image(s) uploaded.` });
      setError("");
    } catch {
      setError("Some gallery images could not be uploaded. Please try again.");
    }

    event.target.value = "";
  };

  const updateListField = (
    field: "includes" | "notIncludes" | "pickupPoints" | "thingsToCarry" | "medicalDisclaimer" | "rules",
    value: string
  ) => {
    setStatus(null);
    setSiteSynced(false);
    setTrips((current) =>
      current.map((item) =>
        item.slug === selectedSlug
          ? {
              ...item,
              [field]: value
                .split(/\n|,/)
                .map((entry) => entry.trim())
                .filter(Boolean),
            }
          : item
      )
    );
  };

  const normalizeItineraryItem = (
    entry: TripData["itinerary"][number]
  ): { time: string; activity: string } => {
    if (typeof entry === "string") {
      return { time: "", activity: entry };
    }

    if (isDayWiseItineraryItem(entry)) {
      return {
        time: "",
        activity: [entry.day, entry.title].filter(Boolean).join(": "),
      };
    }

    return {
      time: entry.time || "",
      activity: entry.activity || "",
    };
  };

  const normalizeDayWiseItem = (
    entry: TripData["itinerary"][number],
    index: number
  ): DayWiseItineraryItem => {
    if (isDayWiseItineraryItem(entry)) {
      return {
        day: entry.day || String(index + 1),
        title: entry.title || "",
        description: entry.description || "",
        location: entry.location || "",
        image: entry.image || "",
        highlights: entry.highlights || [],
      };
    }

    const activity =
      typeof entry === "string"
        ? entry
        : "activity" in entry
          ? entry.activity || ""
          : "";

    return {
      day: String(index + 1),
      title: activity || `Day ${index + 1}`,
      description: "",
      location: "",
      image: "",
      highlights: [],
    };
  };

  const updateItineraryFormat = (format: ItineraryFormat) => {
    if (format === itineraryFormat) return;

    const hasMeaningfulContent = (trip.itinerary || []).some((entry) => {
      if (typeof entry === "string") return entry.trim().length > 0;

      if (isDayWiseItineraryItem(entry)) {
        return Boolean(
          entry.title?.trim() ||
            entry.description?.trim() ||
            entry.location?.trim() ||
            entry.image?.trim() ||
            entry.highlights?.length
        );
      }

      return Boolean(entry.time?.trim() || entry.activity?.trim());
    });

    if (
      hasMeaningfulContent &&
      !window.confirm(
        "Changing the itinerary format will convert the current itinerary. Please review the converted content before saving. Continue?"
      )
    ) {
      return;
    }

    setStatus(null);
    setSiteSynced(false);
    setItineraryFormatOverrides((current) => ({
      ...current,
      [selectedSlug]: format,
    }));

    setTrips((current) =>
      current.map((item) => {
        if (item.slug !== selectedSlug) return item;

        if (format === "DAY_WISE") {
          const converted =
            (item.itinerary || []).length > 0
              ? (item.itinerary || []).map(normalizeDayWiseItem)
              : [
                  {
                    day: "1",
                    title: "Arrival & welcome",
                    description: "Add the complete Day 1 itinerary here.",
                    location: item.destination || "",
                    image: "",
                    highlights: [],
                  },
                ];

          return {
            ...item,
            itinerary: converted,
          };
        }

        const converted =
          (item.itinerary || []).length > 0
            ? (item.itinerary || []).map((entry, index) => {
                if (isDayWiseItineraryItem(entry)) {
                  return {
                    time: "",
                    activity: `Day ${entry.day || index + 1}: ${entry.title}${
                      entry.description ? ` — ${entry.description}` : ""
                    }`,
                  };
                }

                return normalizeItineraryItem(entry);
              })
            : [{ time: "", activity: "Add itinerary details here" }];

        return {
          ...item,
          itinerary: converted,
        };
      })
    );
  };

  const updateItineraryItem = (
    index: number,
    field: "time" | "activity",
    value: string
  ) => {
    setStatus(null);
    setSiteSynced(false);

    setTrips((current) =>
      current.map((item) => {
        if (item.slug !== selectedSlug) return item;

        return {
          ...item,
          itinerary: (item.itinerary || []).map((entry, entryIndex) => {
            const normalized = normalizeItineraryItem(entry);

            if (entryIndex !== index) {
              return normalized;
            }

            return field === "time"
              ? { ...normalized, time: value }
              : { ...normalized, activity: value };
          }),
        };
      })
    );
  };

  const addItineraryItem = () => {
    setStatus(null);
    setSiteSynced(false);

    setTrips((current) =>
      current.map((item) =>
        item.slug === selectedSlug
          ? {
              ...item,
              itinerary: [
                ...(item.itinerary || []).map(normalizeItineraryItem),
                { time: "", activity: "" },
              ],
            }
          : item
      )
    );
  };

  const updateDayWiseItineraryItem = (
    index: number,
    field: keyof DayWiseItineraryItem,
    value: string | string[]
  ) => {
    setStatus(null);
    setSiteSynced(false);

    setTrips((current) =>
      current.map((item) => {
        if (item.slug !== selectedSlug) return item;

        return {
          ...item,
          itinerary: (item.itinerary || []).map((entry, entryIndex) => {
            const normalized = normalizeDayWiseItem(entry, entryIndex);

            return entryIndex === index
              ? { ...normalized, [field]: value }
              : normalized;
          }),
        };
      })
    );
  };

  const addDayWiseItineraryItem = () => {
    setStatus(null);
    setSiteSynced(false);

    setTrips((current) =>
      current.map((item) => {
        if (item.slug !== selectedSlug) return item;

        const existing = (item.itinerary || []).map(normalizeDayWiseItem);

        return {
          ...item,
          itinerary: [
            ...existing,
            {
              day: String(existing.length + 1),
              title: "",
              description: "",
              location: item.destination || "",
              image: "",
              highlights: [],
            },
          ],
        };
      })
    );
  };

  const handleDayImageUpload = async (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadTripImage(file);
      updateDayWiseItineraryItem(index, "image", imageUrl);
      setStatus({
        type: "success",
        message: `Day ${index + 1} image uploaded. Save changes to publish it.`,
      });
      setError("");
    } catch {
      setError("Could not upload the day image. Please try another file.");
    }

    event.target.value = "";
  };

  const deleteItineraryItem = (index: number) => {
    setStatus(null);
    setSiteSynced(false);

    setTrips((current) =>
      current.map((item) =>
        item.slug === selectedSlug
          ? {
              ...item,
              itinerary: (item.itinerary || []).filter(
                (_, entryIndex) => entryIndex !== index
              ),
            }
          : item
      )
    );
  };

  const addTrip = () => {
    const category: TripCategory =
      trip?.category ?? "Sahyadri";

    const timestamp = Date.now();
    const temporarySlug = `new-trip-${timestamp}`;

    const nextTrip: TripData = {
      id: `trip-${timestamp}`,
      slug: temporarySlug,
      title: "New trip",

      tripType: "Fixed Departure",
      travelCategory: "Treks & Adventures",
      destination: "Sahyadri",

      subtitle: "Add a compelling short description",
      summary: "Write a short overview for this trip.",
      cta: "Book this trip",

      difficulty: "Easy",
      startPoint: "Starting point",

      durationDays: 1,

      groupSize: "Small group",

      description:
        "Describe the experience, route, and highlights for travelers here.",

      category,

      image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",

      itinerary: [
        {
          time: "",
          activity: "Add itinerary details here",
        },
      ],

      includes: [
        "Add inclusions here",
      ],

      notIncludes: [
        "Add exclusions here",
      ],

      batches: [],
    };

    setSiteSynced(false);

    setTrips((current) => [
      ...current,
      nextTrip,
    ]);

    setNewTripSlugs((current) =>
      Array.from(
        new Set([
          ...current,
          temporarySlug,
        ])
      )
    );

    setSelectedSlug(temporarySlug);

    setStatus({
      type: "success",
      message:
        "New trip added. Enter the trip title and the URL will be generated automatically.",
    });

    setError("");
  };

  const deleteTrip = async () => {
    if (trips.length <= 1) {
      setError("At least one trip must remain in the catalog.");
      setStatus(null);
      return;
    }

    const tripToDelete = trip;

    const isConfirmed = window.confirm(
      `Permanently delete "${tripToDelete.title}"? This action cannot be undone.`
    );

    if (!isConfirmed || isDeletingTrip) {
      return;
    }

    setIsDeletingTrip(true);
    setError("");
    setStatus(null);

    try {
      const response = await fetch(
        `/api/trips?id=${encodeURIComponent(tripToDelete.id)}`,
        {
          method: "DELETE",
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Unable to delete this trip."
        );
      }

      const remainingTrips = trips.filter(
        (item) => item.id !== tripToDelete.id
      );

      syncSelectedTrip(remainingTrips);
      setSiteSynced(true);
      setStatus({
        type: "success",
        message: `"${tripToDelete.title}" was deleted successfully.`,
      });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this trip."
      );

      setStatus({
        type: "error",
        message: "Trip could not be deleted.",
      });
    } finally {
      setIsDeletingTrip(false);
    }
  };

  const saveTrip = async () => {
    const validationErrors: string[] = [];
    const overview = (trip.overview || trip.description || "").trim();

    if (!trip.title?.trim() || trip.title.trim() === "New trip") validationErrors.push("Enter a proper trip title.");
    if (!trip.category) validationErrors.push("Select a legacy category.");
    if (!trip.travelCategory) validationErrors.push("Select a travel category.");
    if (!trip.destination?.trim()) validationErrors.push("Enter a destination.");
    if (!trip.tripType) validationErrors.push("Select a trip type.");
    if (!trip.subtitle?.trim() || trip.subtitle.trim() === "Add a compelling short description") validationErrors.push("Add a subtitle.");
    if (!trip.difficulty?.trim()) validationErrors.push("Select the difficulty level.");
    if (!trip.startPoint?.trim() || trip.startPoint.trim() === "Starting point") validationErrors.push("Enter the start point.");
    if (!trip.durationDays || trip.durationDays < 1) validationErrors.push("Enter a valid trip duration.");
    if (!trip.groupSize?.trim() || trip.groupSize.trim() === "Small group") validationErrors.push("Enter the group size.");
    if (!trip.summary?.trim() || trip.summary.trim() === "Write a short overview for this trip.") validationErrors.push("Add a trip summary.");
    if (!overview || overview === "Describe the experience, route, and highlights for travelers here.") validationErrors.push("Add the trip overview.");
    if (!trip.image?.trim()) validationErrors.push("Add a main trip image.");
    const hasValidItinerary =
      itineraryFormat === "DAY_WISE"
        ? (trip.itinerary || []).some((entry, index) => {
            const normalized = normalizeDayWiseItem(entry, index);
            return (
              normalized.title.trim().length > 0 &&
              normalized.description.trim().length > 0
            );
          })
        : (trip.itinerary || []).some((entry) => {
            const normalized = normalizeItineraryItem(entry);
            return (
              normalized.activity.trim().length > 0 &&
              normalized.activity.trim() !== "Add itinerary details here"
            );
          });
    if (!hasValidItinerary) {
      validationErrors.push(
        itineraryFormat === "DAY_WISE"
          ? "Add at least one day with a title and description."
          : "Add the trip itinerary."
      );
    }
    if (!trip.includes?.length || trip.includes.includes("Add inclusions here")) validationErrors.push("Add trip inclusions.");
    if (!trip.notIncludes?.length || trip.notIncludes.includes("Add exclusions here")) validationErrors.push("Add trip exclusions.");

    (trip.batches || []).forEach((batch, index) => {
      const needsValidation = batch.visibility === "PUBLIC" || batch.status === "OPEN" || batch.bookingEnabled;
      if (!needsValidation) return;
      const label = `Departure ${index + 1}`;
      if (!batch.departureDate) validationErrors.push(`${label}: select a departure date.`);
      if (!batch.returnDate) validationErrors.push(`${label}: select a return date.`);
      if (batch.departureDate && batch.returnDate && batch.returnDate < batch.departureDate) validationErrors.push(`${label}: return date cannot be before departure date.`);
      if (!batch.price || batch.price <= 0) validationErrors.push(`${label}: enter a valid price.`);
      if (!batch.totalSeats || batch.totalSeats < 1) validationErrors.push(`${label}: total seats must be at least 1.`);
      if (batch.bookedSeats < 0 || batch.bookedSeats > batch.totalSeats) validationErrors.push(`${label}: booked seats are invalid.`);
      if (batch.paymentMode === "ADVANCE" && (!batch.advanceAmount || batch.advanceAmount <= 0 || batch.advanceAmount > batch.price)) {
        validationErrors.push(`${label}: enter a valid advance amount.`);
      }
    });

    if (trip.tripType === "Fixed Departure" && trip.upcoming && (trip.batches || []).length === 0) {
      validationErrors.push("Add at least one departure before showing this fixed-departure trip in Upcoming Adventures.");
    }

    if (validationErrors.length) {
      setError(validationErrors[0]);
      setStatus({ type: "error", message: `${validationErrors.length} item${validationErrors.length === 1 ? "" : "s"} need attention before saving.` });
      window.alert(`Please complete the following before saving:\n\n${validationErrors.map((item) => `• ${item}`).join("\n")}`);
      return;
    }

    const response = await fetch("/api/trips", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip),
      cache: "no-store",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error || "Failed to save trip details.");
      setStatus({
        type: "error",
        message: data?.error || "Changes could not be saved.",
      });
      return;
    }

    setError("");
    setStatus({ type: "success", message: "Trip details saved successfully. Site sync complete." });
    setSiteSynced(true);

    /*
     * Once this trip has been saved, treat its URL as published/stable.
     * Future title edits will not automatically change the public URL.
     */
    setNewTripSlugs((current) =>
      current.filter(
        (slug) =>
          slug !== selectedSlug
      )
    );

    try {
      const refreshed = await fetch("/api/trips", { cache: "no-store" });
      if (refreshed.ok) {
        const data = await refreshed.json();
        if (Array.isArray(data) && data.length > 0) {
          syncSelectedTrip(data);
        }
      }
    } catch {
      // Ignore refresh errors; local state is already updated.
    }
  };

  const refreshPublicSite = async () => {
    try {
      const response = await fetch("/api/trips", { cache: "no-store" });
      if (!response.ok) {
        setError("Could not refresh the public site.");
        return;
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        syncSelectedTrip(data);
        setSiteSynced(true);
        setStatus({ type: "success", message: "Public site refreshed successfully." });
        setError("");
        return;
      }

      setError("No trip data was returned from the public site refresh.");
    } catch {
      setError("Could not connect to refresh the public site.");
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
  event.preventDefault();

  setError("");
  setIsLoggingIn(true);

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.ok) {
      setError(
        data?.error || "Incorrect username or password."
      );
      return;
    }

    setIsAuthenticated(true);
    setPassword("");
    setError("");
  } catch {
    setError(
      "Unable to log in right now. Please try again."
    );
  } finally {
    setIsLoggingIn(false);
  }
};

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f3ee] px-6 py-12 text-[#17251d]">
        <div className="w-full max-w-md rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.32em] text-orange-500">
            Protected area
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Admin login
          </h1>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-medium text-[#17251d]">
             <span>Username</span>

             <input
            type="text"
    value={username}
    onChange={(event) =>
      setUsername(event.target.value)
    }
    placeholder="Enter admin username"
    autoComplete="username"
    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
  />
</label>
<label className="block space-y-2 text-sm font-medium text-[#17251d]">
  <span>Password</span>

  <input
    type="password"
    value={password}
    onChange={(event) =>
      setPassword(event.target.value)
    }
    placeholder="Enter admin password"
    autoComplete="current-password"
    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
  />
</label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
  type="submit"
  disabled={
    isLoggingIn ||
    !username.trim() ||
    !password
  }
  className="inline-flex w-full items-center justify-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
>
  {isLoggingIn
    ? "Signing in..."
    : "Enter admin panel"}
</button>
          </form>

          <a
            href="/"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
          >
            Back to homepage
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3ee] px-6 py-12 text-[#17251d] lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.32em] text-orange-500">
              Admin panel
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Manage featured trip details
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                siteSynced ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {siteSynced ? "Site synced" : "Unsaved changes"}
            </span>
            <button
              type="button"
              onClick={refreshPublicSite}
              className="inline-flex w-fit items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
            >
              Refresh public site
            </button>

            <a
              href={`/trips/${trip.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
            >
              Open trip page
            </a>

            <button
  type="button"
  onClick={async () => {
    try {
      await fetch(
        "/api/admin/logout",
        {
          method: "POST",
        }
      );
    } finally {
      setIsAuthenticated(false);
      setUsername("");
      setPassword("");
    }
  }}
  className="inline-flex w-fit items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
>
  Log out
</button>

            <button
              type="button"
              onClick={addTrip}
              className="inline-flex w-fit items-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              Add trip
            </button>

            <button
              type="button"
              onClick={deleteTrip}
              disabled={isDeletingTrip}
              className="inline-flex w-fit items-center rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeletingTrip ? "Deleting..." : "Delete trip"}
            </button>

            <a
              href="/"
              className="inline-flex w-fit items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
            >
              View homepage
            </a>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAdminSection("TRIPS")}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              adminSection === "TRIPS"
                ? "bg-[#17251d] text-white"
                : "border border-[#17251d]/15 bg-white text-[#17251d] hover:bg-[#17251d] hover:text-white"
            }`}
          >
            Trips & Departures
          </button>

          <button
            type="button"
            onClick={() => setAdminSection("COUPONS")}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              adminSection === "COUPONS"
                ? "bg-[#17251d] text-white"
                : "border border-[#17251d]/15 bg-white text-[#17251d] hover:bg-[#17251d] hover:text-white"
            }`}
          >
            Coupons & Discounts
          </button>
        </div>

        {adminSection === "TRIPS" && (
        <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)] lg:p-8">
          <label className="mb-6 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Select trip</span>
            <select
              value={selectedSlug}
              onChange={(event) => setSelectedSlug(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            >
              {trips.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>

          {/* BASIC TRIP DETAILS */}
          <div className="mb-8 grid gap-5 rounded-[28px] border border-black/10 bg-[#f7f5f2] p-5 md:grid-cols-2 lg:p-6">
            <label className="block space-y-2 text-sm font-medium text-[#17251d]">
              <span>Trip title</span>
              <input
                type="text"
                value={trip.title}
                onChange={(event) => updateTripTitle(event.target.value)}
                placeholder="Example: Rajmachi Fort Trek"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
              />
              <p className="text-xs leading-5 text-[#718078]">
                This is the public trip name shown on the website.
              </p>
            </label>

            <div className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Trip URL</span>
              <div className="flex min-h-[50px] items-center rounded-2xl border border-black/10 bg-white px-4 text-sm text-[#5d6862]">
                /trips/{trip.slug}
              </div>
              <p className="text-xs leading-5 text-[#718078]">
                A new trip URL is generated automatically from its title. Existing trip URLs stay unchanged when you rename the title.
              </p>
            </div>

            <label className="block space-y-2 text-sm font-medium text-[#17251d]">
              <span>Travel category</span>
              <select
                value={trip.travelCategory || ""}
                onChange={(event) => {
                  setStatus(null);
                  setSiteSynced(false);
                  setTrips((current) =>
                    current.map((item) =>
                      item.slug === selectedSlug
                        ? {
                            ...item,
                            travelCategory: event.target.value as TravelCategory,
                          }
                        : item
                    )
                  );
                }}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
              >
                <option value="">Select travel category</option>
                {travelCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-5 text-[#718078]">
                Main customer-facing group: Treks & Adventures, Domestic Tours or International Tours.
              </p>
            </label>

            <label className="block space-y-2 text-sm font-medium text-[#17251d]">
              <span>Destination</span>
              <input
                type="text"
                value={trip.destination || ""}
                onChange={(event) => updateField("destination", event.target.value)}
                placeholder="Example: Kerala, Andaman, Mysuru, Ladakh, Nepal"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
              />
              <p className="text-xs leading-5 text-[#718078]">
                Enter the destination or region for this trip. You can add new destinations without changing code.
              </p>
            </label>

            <label className="block space-y-2 text-sm font-medium text-[#17251d]">
              <span>Trip type</span>
              <select
                value={trip.tripType}
                onChange={(event) => updateField("tripType", event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
              >
                <option value="Fixed Departure">Fixed Departure</option>
                <option value="Custom Trip">Custom Trip</option>
                <option value="Corporate">Corporate</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium text-[#17251d] md:col-span-2">
              <span>Subtitle</span>
              <input
                type="text"
                value={trip.subtitle || ""}
                onChange={(event) => updateField("subtitle", event.target.value)}
                placeholder="A short line describing the experience"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-[#17251d]">
              <span>Difficulty</span>
              <select
                value={trip.difficulty || ""}
                onChange={(event) => updateField("difficulty", event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
              >
                <option value="">Select difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Easy to Moderate">Easy to Moderate</option>
                <option value="Moderate">Moderate</option>
                <option value="Moderate to Difficult">Moderate to Difficult</option>
                <option value="Difficult">Difficult</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium text-[#17251d]">
              <span>Start point</span>
              <input
                type="text"
                value={trip.startPoint || ""}
                onChange={(event) => updateField("startPoint", event.target.value)}
                placeholder="Example: Pune"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-[#17251d]">
              <span>Duration (days)</span>
              <input
                type="number"
                min="1"
                value={trip.durationDays || 1}
                onChange={(event) => {
                  setStatus(null);
                  setSiteSynced(false);
                  setTrips((current) =>
                    current.map((item) =>
                      item.slug === selectedSlug
                        ? { ...item, durationDays: Math.max(1, Number(event.target.value) || 1) }
                        : item
                    )
                  );
                }}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-[#17251d]">
              <span>Group size</span>
              <input
                type="text"
                value={trip.groupSize || ""}
                onChange={(event) => updateField("groupSize", event.target.value)}
                placeholder="Example: Maximum 40 participants"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>
          </div>

          <div className="mt-8 rounded-[28px] border border-black/10 bg-[#f7f5f2] p-5 lg:p-6">
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
        Departures
      </p>

      <h2 className="mt-2 text-2xl font-bold text-[#17251d]">
        Manage trip batches
      </h2>

      <p className="mt-2 text-sm text-[#5d6862]">
        Each departure can have its own date, price, capacity and payment rules.
      </p>
    </div>

    <button
      type="button"
      onClick={addBatch}
      className="inline-flex items-center justify-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
    >
      + Add departure
    </button>
  </div>

  {(trip.batches || []).length === 0 ? (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center">
      <p className="font-semibold text-[#17251d]">
        No departures added yet
      </p>

      <p className="mt-2 text-sm text-[#5d6862]">
        Add a departure before enabling direct booking for this trip.
      </p>
    </div>
  ) : (
    <div className="space-y-5">
      {(trip.batches || []).map((batch, index) => {
        const availableSeats = Math.max(
          0,
          batch.totalSeats - batch.bookedSeats
        );

        return (
          <div
            key={batch.id}
            className="rounded-[24px] border border-black/10 bg-white p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
                  Departure {index + 1}
                </p>

                <p className="mt-1 text-sm text-[#5d6862]">
                  {batch.departureDate || "Date not set"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => deleteBatch(batch.id)}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                Delete
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {/* Departure date */}
              <label className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Departure date</span>

                <input
                  type="date"
                  value={batch.departureDate}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "departureDate",
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              {/* Return date */}
              <label className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Return date</span>

                <input
                  type="date"
                  value={batch.returnDate}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "returnDate",
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              {/* Price */}
              <label className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Price per person ₹</span>

                <input
                  type="number"
                  min="0"
                  value={batch.price}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "price",
                      Number(event.target.value)
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              {/* Total seats */}
              <label className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Total seats</span>

                <input
                  type="number"
                  min="1"
                  value={batch.totalSeats}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "totalSeats",
                      Math.max(1, Number(event.target.value))
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              {/* Booked seats */}
              <label className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Booked seats</span>

                <input
                  type="number"
                  min="0"
                  max={batch.totalSeats}
                  value={batch.bookedSeats}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "bookedSeats",
                      Math.min(
                        batch.totalSeats,
                        Math.max(0, Number(event.target.value))
                      )
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              {/* Available seats */}
              <div className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Available seats</span>

                <div className="flex h-[50px] items-center rounded-2xl border border-green-200 bg-green-50 px-4 font-bold text-green-700">
                  {availableSeats}
                </div>
              </div>

              {/* Payment mode */}
              <label className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Payment mode</span>

                <select
                  value={batch.paymentMode}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "paymentMode",
                      event.target.value as TripBatch["paymentMode"]
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="FULL">Full payment</option>
                  <option value="ADVANCE">Advance payment</option>
                </select>
              </label>

              {/* Advance */}
              <label className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Advance per person ₹</span>

                <input
                  type="number"
                  min="0"
                  max={batch.price}
                  value={batch.advanceAmount}
                  disabled={batch.paymentMode === "FULL"}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "advanceAmount",
                      Number(event.target.value)
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              {/* Status */}
              <label className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Status</span>

                <select
                  value={batch.status}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "status",
                      event.target.value as TripBatch["status"]
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open</option>
                  <option value="FULL">Full</option>
                  <option value="CLOSED">Closed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </label>

              {/* Visibility */}
              <label className="space-y-2 text-sm font-medium text-[#17251d]">
                <span>Visibility</span>

                <select
                  value={batch.visibility}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "visibility",
                      event.target.value as TripBatch["visibility"]
                    )
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </label>

              {/* Booking */}
              <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-4 text-sm font-medium text-[#17251d]">
                <input
                  type="checkbox"
                  checked={batch.bookingEnabled}
                  onChange={(event) =>
                    updateBatch(
                      batch.id,
                      "bookingEnabled",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-orange-500"
                />

                <span>Allow online booking</span>
              </label>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-[#f7f5f2] p-4 text-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#17251d]/50">
                  Capacity
                </p>

                <p className="mt-1 text-xl font-bold">
                  {batch.totalSeats}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#17251d]/50">
                  Booked
                </p>

                <p className="mt-1 text-xl font-bold">
                  {batch.bookedSeats}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#17251d]/50">
                  Available
                </p>

                <p className="mt-1 text-xl font-bold text-green-600">
                  {availableSeats}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Summary</span>
            <textarea
              value={trip.summary}
              onChange={(event) => updateField("summary", event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Overview</span>
            <textarea
              value={trip.overview || trip.description || ""}
              onChange={(event) => updateField("overview", event.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <div className="mt-5 rounded-[24px] border border-black/10 bg-[#f7f5f2] p-5">
            <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <span className="text-sm font-medium text-[#17251d]">Itinerary</span>
                <p className="mt-1 text-xs leading-5 text-[#718078]">
                  Use Timed itinerary for treks and tightly scheduled departures.
                  Use Day-wise itinerary for domestic and international tour packages.
                </p>
              </div>

              <label className="block min-w-[240px] space-y-2 text-sm font-medium text-[#17251d]">
                <span>Itinerary format</span>
                <select
                  value={itineraryFormat}
                  onChange={(event) =>
                    updateItineraryFormat(event.target.value as ItineraryFormat)
                  }
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="TIMED">Timed itinerary</option>
                  <option value="DAY_WISE">Day-wise itinerary</option>
                </select>
              </label>
            </div>

            {itineraryFormat === "TIMED" ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs leading-5 text-[#718078]">
                    Add a time and activity for each step. Leave the time blank for headings such as Day 1 or Day 2.
                  </p>
                  <button
                    type="button"
                    onClick={addItineraryItem}
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#17251d] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-500"
                  >
                    + Add activity
                  </button>
                </div>

                <div className="space-y-3">
                  {(trip.itinerary || []).map((entry, index) => {
                    const itineraryItem = normalizeItineraryItem(entry);

                    return (
                      <div
                        key={`timed-${index}`}
                        className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4 md:grid-cols-[180px_1fr_auto] md:items-end"
                      >
                        <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                          <span>Time</span>
                          <input
                            type="text"
                            value={itineraryItem.time}
                            onChange={(event) =>
                              updateItineraryItem(index, "time", event.target.value)
                            }
                            placeholder="Example: 06:00 AM"
                            className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                          />
                        </label>

                        <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                          <span>Activity</span>
                          <input
                            type="text"
                            value={itineraryItem.activity}
                            onChange={(event) =>
                              updateItineraryItem(index, "activity", event.target.value)
                            }
                            placeholder="Example: Departure from Pune"
                            className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => deleteItineraryItem(index)}
                          className="h-[50px] rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}

                  {(trip.itinerary || []).length === 0 && (
                    <div className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-center text-sm text-[#5d6862]">
                      No itinerary activities yet. Select “Add activity” to create the first one.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs leading-5 text-[#718078]">
                    Create one card per day. Add a title, detailed description, location, image and optional highlights.
                  </p>
                  <button
                    type="button"
                    onClick={addDayWiseItineraryItem}
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#17251d] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-500"
                  >
                    + Add day
                  </button>
                </div>

                <div className="space-y-5">
                  {(trip.itinerary || []).map((entry, index) => {
                    const dayItem = normalizeDayWiseItem(entry, index);

                    return (
                      <div
                        key={`day-wise-${index}`}
                        className="rounded-[22px] border border-black/10 bg-white p-5"
                      >
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
                              Day {dayItem.day || index + 1}
                            </p>
                            <p className="mt-1 text-sm text-[#718078]">
                              Tour-package itinerary card
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteItineraryItem(index)}
                            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Delete day
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="space-y-2 text-sm font-medium text-[#17251d]">
                            <span>Day number</span>
                            <input
                              type="text"
                              value={dayItem.day}
                              onChange={(event) =>
                                updateDayWiseItineraryItem(index, "day", event.target.value)
                              }
                              placeholder="1"
                              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                            />
                          </label>

                          <label className="space-y-2 text-sm font-medium text-[#17251d]">
                            <span>Location</span>
                            <input
                              type="text"
                              value={dayItem.location || ""}
                              onChange={(event) =>
                                updateDayWiseItineraryItem(index, "location", event.target.value)
                              }
                              placeholder="Example: Dubai"
                              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                            />
                          </label>

                          <label className="space-y-2 text-sm font-medium text-[#17251d] md:col-span-2">
                            <span>Day title</span>
                            <input
                              type="text"
                              value={dayItem.title}
                              onChange={(event) =>
                                updateDayWiseItineraryItem(index, "title", event.target.value)
                              }
                              placeholder="Example: Arrival in Dubai & Marina Dhow Cruise"
                              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                            />
                          </label>

                          <label className="space-y-2 text-sm font-medium text-[#17251d] md:col-span-2">
                            <span>Description</span>
                            <textarea
                              value={dayItem.description}
                              onChange={(event) =>
                                updateDayWiseItineraryItem(index, "description", event.target.value)
                              }
                              rows={5}
                              placeholder="Write the complete day plan, sightseeing flow, transfers and experience details."
                              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                            />
                          </label>

                          <label className="space-y-2 text-sm font-medium text-[#17251d] md:col-span-2">
                            <span>Highlights</span>
                            <textarea
                              value={(dayItem.highlights || []).join("\n")}
                              onChange={(event) =>
                                updateDayWiseItineraryItem(
                                  index,
                                  "highlights",
                                  event.target.value
                                    .split(/\n|,/)
                                    .map((value) => value.trim())
                                    .filter(Boolean)
                                )
                              }
                              rows={3}
                              placeholder={"Airport transfer\nBurj Khalifa\nDinner"}
                              className="w-full rounded-xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                            />
                            <p className="text-xs text-[#718078]">
                              Add one highlight per line.
                            </p>
                          </label>

                          <div className="space-y-3 md:col-span-2">
                            <p className="text-sm font-medium text-[#17251d]">Day image</p>

                            {dayItem.image ? (
                              <div className="overflow-hidden rounded-2xl border border-black/10">
                                <img
                                  src={dayItem.image}
                                  alt={`Day ${dayItem.day} itinerary`}
                                  className="h-52 w-full object-cover"
                                />
                              </div>
                            ) : null}

                            <div className="flex flex-wrap gap-3">
                              <label className="inline-flex cursor-pointer items-center rounded-full bg-[#17251d] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-500">
                                Upload day image
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => handleDayImageUpload(index, event)}
                                  className="hidden"
                                />
                              </label>

                              {dayItem.image ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDayWiseItineraryItem(index, "image", "")
                                  }
                                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600"
                                >
                                  Remove image
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(trip.itinerary || []).length === 0 && (
                    <div className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-center text-sm text-[#5d6862]">
                      No itinerary days yet. Select “Add day” to create Day 1.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Included</span>
            <textarea
              value={(trip.includes || []).join("\n")}
              onChange={(event) => updateListField("includes", event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Not included</span>
            <textarea
              value={(trip.notIncludes || []).join("\n")}
              onChange={(event) => updateListField("notIncludes", event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Pickup points</span>
            <textarea
              value={(trip.pickupPoints || []).join("\n")}
              onChange={(event) => updateListField("pickupPoints", event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Things to carry</span>
            <textarea
              value={(trip.thingsToCarry || []).join("\n")}
              onChange={(event) => updateListField("thingsToCarry", event.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Medical disclaimer</span>
            <textarea
              value={(trip.medicalDisclaimer || []).join("\n")}
              onChange={(event) => updateListField("medicalDisclaimer", event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Rules</span>
            <textarea
              value={(trip.rules || []).join("\n")}
              onChange={(event) => updateListField("rules", event.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

          <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[24px] border border-black/10 bg-[#f7f5f2] p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-[#17251d]/60">Current main image</p>
              <div
                className="h-56 w-full rounded-[18px] bg-cover bg-center"
                style={{ backgroundImage: `url('${trip.image}')` }}
              />
            </div>

            <div className="space-y-4">
              <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                <span>Hero image URL</span>
                <input
                  value={trip.image}
                  onChange={(event) => updateField("image", event.target.value)}
                  placeholder="Paste a full image URL here"
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Upload main image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full rounded-2xl border border-dashed border-black/20 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-[#17251d]">
                  <span>Upload gallery images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="w-full rounded-2xl border border-dashed border-black/20 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-black/10 bg-[#f7f5f2] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-[#17251d]/60">Photo set</p>
              <span className="text-sm text-[#5d6862]">{(trip.gallery && trip.gallery.length > 0 ? trip.gallery : [trip.image].filter(Boolean)).length} photos</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(trip.gallery && trip.gallery.length > 0 ? trip.gallery : [trip.image].filter(Boolean)).map((image, index) => (
                <div key={`${image}-${index}`} className="overflow-hidden rounded-[18px] border border-black/10 bg-white">
                  <div className="h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
                  <div className="flex gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => setMainImage(image)}
                      className="flex-1 rounded-full bg-[#17251d] px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-500"
                    >
                      Main
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(image)}
                      className="flex-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Button text</span>
            <input
              value={trip.cta}
              onChange={(event) => updateField("cta", event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>
          <label className="mt-5 flex items-center gap-3 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-4 text-sm font-medium text-[#17251d]">
  <input
    type="checkbox"
    checked={trip.upcoming ?? false}
    onChange={(event) => {
      setSiteSynced(false);
      setStatus(null);
      setTrips((current) =>
        current.map((item) =>
          item.slug === selectedSlug
            ? { ...item, upcoming: event.target.checked }
            : item
        )
      );
    }}
    className="h-5 w-5 accent-orange-500"
  />

  <span>
    Show this trip in <strong>Upcoming Adventures</strong>
  </span>
</label>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={setFeatured}
              className={`inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                trip.featured
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "border border-[#17251d]/15 bg-white text-[#17251d] hover:bg-[#17251d] hover:text-white"
              }`}
            >
              {trip.featured ? "★ Featured" : "☆ Set as featured"}
            </button>

            <button
              type="button"
              onClick={saveTrip}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-600"
            >
              Save changes
            </button>

            {error && <p className="self-center text-sm text-red-600">{error}</p>}
            {status && (
              <p
                className={`self-center text-sm ${
                  status.type === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {status.message}
              </p>
            )}
          </div>
        </div>
        )}

        {adminSection === "COUPONS" && (
          <CouponManager trips={trips} />
        )}
      </div>
    </main>
  );
}
