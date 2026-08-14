"use client";

import { useEffect, useState } from "react";
import { defaultTrips, tripCategories, type TripCategory, type TripData } from "../data/trips";

const ADMIN_PASSWORD = "bucketlist123";
const createSlug = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export default function AdminPage() {
  const [trips, setTrips] = useState<TripData[]>(defaultTrips);
  const [selectedSlug, setSelectedSlug] = useState(defaultTrips[0]?.slug ?? "");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [siteSynced, setSiteSynced] = useState(true);

  const trip = trips.find((item) => item.slug === selectedSlug) ?? trips[0] ?? defaultTrips[0];

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
      const dataUrl = await readFileAsDataUrl(file);
      setSiteSynced(false);
      setTrips((current) =>
        current.map((item) =>
          item.slug === selectedSlug
            ? {
                ...item,
                image: dataUrl,
                gallery: Array.from(new Set([dataUrl, ...(item.gallery || [])])),
              }
            : item
        )
      );
      setStatus({ type: "success", message: "Main image uploaded and saved to this trip." });
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
      const uploaded = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
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
    field: "itinerary" | "includes" | "notIncludes" | "pickupPoints" | "thingsToCarry" | "medicalDisclaimer" | "rules",
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

  const addTrip = () => {
    const category: TripCategory = trip?.category ?? "Sahyadri";
    const nextTrip: TripData = {
      id: `trip-${Date.now()}`,
      slug: "new-trip",
      title: "New trip",
      subtitle: "Add a compelling short description",
      summary: "Write a short overview for this trip.",
      cta: "Book this trip",
      price: "From ₹0 / person",
      duration: "3 Days",
      seats: "Open seats",
      difficulty: "Easy",
      startPoint: "Starting point",
      groupSize: "Small group",
      description: "Describe the experience, route, and highlights for travelers here.",
      category,
      image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
      itinerary: ["Day 1 arrival and briefing", "Day 2 adventure day", "Day 3 return and wrap-up"],
      includes: ["Stay", "Meals", "Guide support"],
      notIncludes: ["Flights", "Personal gear"],
    };

    setSiteSynced(false);
    setTrips((current) => [...current, nextTrip]);
    setSelectedSlug(nextTrip.slug);
    setStatus({ type: "success", message: "New trip added. Save to persist it." });
    setError("");
  };

  const deleteTrip = () => {
    if (trips.length <= 1) {
      setError("At least one trip must remain in the catalog.");
      setStatus(null);
      return;
    }

    const isConfirmed = window.confirm(`Delete "${trip.title}" from the trip catalog?`);
    if (!isConfirmed) {
      return;
    }

    const remainingTrips = trips.filter((item) => item.slug !== selectedSlug);
    setSiteSynced(false);
    syncSelectedTrip(remainingTrips);
    setStatus({ type: "success", message: "Trip deleted from the current catalog. Save to confirm." });
    setError("");
  };

  const saveTrip = async () => {
    const response = await fetch("/api/trips", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trips),
      cache: "no-store",
    });

    if (!response.ok) {
      setError("Failed to save trip details.");
      setStatus({ type: "error", message: "Changes could not be saved." });
      return;
    }

    setError("");
    setStatus({ type: "success", message: "Trip details saved successfully. Site sync complete." });
    setSiteSynced(true);

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

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
      return;
    }

    setError("Incorrect password. Please try again.");
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
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              Enter admin panel
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
              onClick={() => setIsAuthenticated(false)}
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
              className="inline-flex w-fit items-center rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              Delete trip
            </button>

            <a
              href="/"
              className="inline-flex w-fit items-center rounded-full border border-[#17251d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#17251d] transition hover:bg-[#17251d] hover:text-white"
            >
              View homepage
            </a>
          </div>
        </div>

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

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Trip category</span>
              <select
                value={trip.category}
                onChange={(event) => updateField("category", event.target.value as TripCategory)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              >
                {tripCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Trip title</span>
              <input
  value={trip.title}
  onChange={(event) => {
    const newTitle = event.target.value;

    setSiteSynced(false);
    setStatus(null);

    setTrips((current) =>
      current.map((item) =>
        item.slug === selectedSlug
          ? {
              ...item,
              title: newTitle,
              slug: createSlug(newTitle),
            }
          : item
      )
    );

    setSelectedSlug(createSlug(newTitle));
  }}
  className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
/>
            </label>

            <label className="space-y-2 text-sm font-medium text-[#17251d] md:col-span-2">
              <span>Image URL</span>
              <input
                value={trip.image}
                onChange={(event) => updateField("image", event.target.value)}
                placeholder="Paste a full image URL here"
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Hero subtitle</span>
              <input
                value={trip.subtitle}
                onChange={(event) => updateField("subtitle", event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Price</span>
              <input
                value={trip.price}
                onChange={(event) => updateField("price", event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Duration</span>
              <input
                value={trip.duration}
                onChange={(event) => updateField("duration", event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Seats left</span>
              <input
                value={trip.seats}
                onChange={(event) => updateField("seats", event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Difficulty</span>
              <input
                value={trip.difficulty}
                onChange={(event) => updateField("difficulty", event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Start point</span>
              <input
                value={trip.startPoint}
                onChange={(event) => updateField("startPoint", event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[#17251d]">
              <span>Group size</span>
              <input
                value={trip.groupSize}
                onChange={(event) => updateField("groupSize", event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
              />
            </label>
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

          <label className="mt-5 block space-y-2 text-sm font-medium text-[#17251d]">
            <span>Itinerary</span>
            <textarea
              value={(trip.itinerary || []).join("\n")}
              onChange={(event) => updateListField("itinerary", event.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
            />
          </label>

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
      </div>
    </main>
  );
}
