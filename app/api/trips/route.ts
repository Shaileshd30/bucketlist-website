import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

import type {
  TripBatch,
  TripData,
} from "@/app/data/trips";

export const dynamic = "force-dynamic";

type TripRow = {
  id: string;
  slug: string;
  title: string;
  trip_type: TripData["tripType"] | null;
  category: TripData["category"];
  highlight: string | null;
  subtitle: string | null;
  summary: string | null;
  cta: string | null;
  difficulty: string | null;
  start_point: string | null;
  duration_days: number | null;
  group_size: string | null;
  description: string | null;
  overview: string | null;
  image: string | null;
  gallery: string[] | null;
  itinerary: TripData["itinerary"] | null;
  includes: string[] | null;
  not_includes: string[] | null;
  pickup_points: string[] | null;
  things_to_carry: string[] | null;
  medical_disclaimer: string[] | null;
  rules: string[] | null;
  featured: boolean | null;
};

type BatchRow = {
  id: string;
  trip_id: string;
  departure_date: string;
  return_date: string;
  price: number | string;
  total_seats: number;
  booked_seats: number;
  payment_mode: TripBatch["paymentMode"];
  advance_amount: number | string;
  balance_due_date: string | null;
  status: TripBatch["status"];
  visibility: TripBatch["visibility"];
  booking_enabled: boolean;
};

function mapBatch(row: BatchRow): TripBatch {
  return {
    id: row.id,

    departureDate: row.departure_date,
    returnDate: row.return_date,

    price: Number(row.price),

    totalSeats: row.total_seats,
    bookedSeats: row.booked_seats,

    paymentMode: row.payment_mode,
    advanceAmount: Number(row.advance_amount),

    balanceDueDate:
      row.balance_due_date || undefined,

    status: row.status,
    visibility: row.visibility,

    bookingEnabled: row.booking_enabled,
  };
}

function mapTrip(
  row: TripRow,
  batches: TripBatch[]
): TripData {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,

    tripType:
      row.trip_type || undefined,

    category: row.category,

    highlight:
      row.highlight || undefined,

    subtitle:
      row.subtitle || "",

    summary:
      row.summary || "",

    cta:
      row.cta || "Book Now",

    difficulty:
      row.difficulty || "",

    startPoint:
      row.start_point || "",

    durationDays:
      row.duration_days || undefined,

    groupSize:
      row.group_size || undefined,

    description:
      row.description || undefined,

    overview:
      row.overview || undefined,

    image:
      safePublicImage(row.image),

    gallery:
      sanitizeGallery(row.gallery),

    itinerary:
      row.itinerary || [],

    includes:
      row.includes || [],

    notIncludes:
      row.not_includes || [],

    pickupPoints:
      row.pickup_points || [],

    thingsToCarry:
      row.things_to_carry || [],

    medicalDisclaimer:
      row.medical_disclaimer || [],

    rules:
      row.rules || [],

    featured:
      row.featured || false,

    batches,
  };
}


function isDataUrl(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().startsWith("data:");
}

function safePublicImage(value: string | null | undefined) {
  const image = (value || "").trim();

  if (isDataUrl(image)) {
    return "";
  }

  return image;
}

function sanitizeGallery(values: string[] | null | undefined) {
  return (values || [])
    .map((value) => (value || "").trim())
    .filter((value) => value && !isDataUrl(value));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim() || "";
    const summaryOnly = url.searchParams.get("summary") === "1";

    if (slug) {
      const tripResult = await supabaseAdmin
        .from("trips")
        .select("*")
        .eq("slug", slug)
        .eq("archived", false)
        .maybeSingle();

      if (tripResult.error) {
        throw tripResult.error;
      }

      if (!tripResult.data) {
        return Response.json(
          { error: "Trip not found." },
          {
            status: 404,
            headers: {
              "Cache-Control":
                "no-store, no-cache, must-revalidate, max-age=0",
            },
          }
        );
      }

      const tripRow = tripResult.data as TripRow;

      const batchesResult = await supabaseAdmin
        .from("trip_batches")
        .select("*")
        .eq("trip_id", tripRow.id)
        .order("departure_date", {
          ascending: true,
        });

      if (batchesResult.error) {
        throw batchesResult.error;
      }

      const batches = ((batchesResult.data || []) as BatchRow[]).map(mapBatch);

      return Response.json(
        mapTrip(tripRow, batches),
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, max-age=0",
          },
        }
      );
    }
    if (summaryOnly) {
      const [tripsResult, batchesResult] = await Promise.all([
        supabaseAdmin
          .from("trips")
          .select(
            "id,slug,title,trip_type,category,highlight,subtitle,summary,cta,difficulty,start_point,duration_days,group_size,featured"
          )
          .eq("archived", false)
          .order("created_at", {
            ascending: true,
          }),

        supabaseAdmin
          .from("trip_batches")
          .select(
            "id,trip_id,departure_date,return_date,price,total_seats,booked_seats,payment_mode,advance_amount,balance_due_date,status,visibility,booking_enabled"
          )
          .order("departure_date", {
            ascending: true,
          }),
      ]);

      if (tripsResult.error) {
        throw tripsResult.error;
      }

      if (batchesResult.error) {
        throw batchesResult.error;
      }

      const tripRows = (tripsResult.data || []) as TripRow[];
      const batchRows = (batchesResult.data || []) as BatchRow[];

      const batchesByTrip = new Map<string, TripBatch[]>();

      for (const row of batchRows) {
        const existing = batchesByTrip.get(row.trip_id) || [];
        existing.push(mapBatch(row));
        batchesByTrip.set(row.trip_id, existing);
      }

      const trips = tripRows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        tripType: row.trip_type || undefined,
        category: row.category,
        highlight: row.highlight || undefined,
        subtitle: row.subtitle || "",
        summary: row.summary || "",
        cta: row.cta || "Book Now",
        difficulty: row.difficulty || "",
        startPoint: row.start_point || "",
        durationDays: row.duration_days || undefined,
        groupSize: row.group_size || undefined,
        image: "",
        featured: row.featured || false,
        batches: batchesByTrip.get(row.id) || [],
      }));

      return Response.json(trips, {
        headers: {
          "Cache-Control":
            "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    const [
      tripsResult,
      batchesResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("trips")
        .select("*")
        .eq("archived", false)
        .order("created_at", {
          ascending: true,
        }),

      supabaseAdmin
        .from("trip_batches")
        .select("*")
        .order("departure_date", {
          ascending: true,
        }),
    ]);

    if (tripsResult.error) {
      throw tripsResult.error;
    }

    if (batchesResult.error) {
      throw batchesResult.error;
    }

    const tripRows =
      (tripsResult.data || []) as TripRow[];

    const batchRows =
      (batchesResult.data || []) as BatchRow[];

    const batchesByTrip =
      new Map<string, TripBatch[]>();

    for (const row of batchRows) {
      const existing =
        batchesByTrip.get(row.trip_id) || [];

      existing.push(
        mapBatch(row)
      );

      batchesByTrip.set(
        row.trip_id,
        existing
      );
    }

    const trips = tripRows.map(
      (row) =>
        mapTrip(
          row,
          batchesByTrip.get(row.id) || []
        )
    );

    return Response.json(
      trips,
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/trips failed:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to load trips.",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }
}


type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: undefined as string | undefined,
      details: undefined as string | undefined,
      hint: undefined as string | undefined,
    };
  }

  const value = (error || {}) as SupabaseLikeError;

  return {
    message: value.message || "Unexpected database error.",
    code: value.code,
    details: value.details,
    hint: value.hint,
  };
}

async function saveSingleTrip(trip: TripData) {
  const tripRow = {
    id: trip.id,
    slug: trip.slug,
    title: trip.title,
    trip_type: trip.tripType || null,
    category: trip.category,
    highlight: trip.highlight || null,
    subtitle: trip.subtitle || "",
    summary: trip.summary || "",
    cta: trip.cta || "Book Now",
    difficulty: trip.difficulty || "",
    start_point: trip.startPoint || "",
    duration_days: trip.durationDays || null,
    group_size: trip.groupSize || null,
    description: trip.description || null,
    overview: trip.overview || null,
    image: safePublicImage(trip.image),
    gallery: sanitizeGallery(trip.gallery),
    itinerary: trip.itinerary || [],
    includes: trip.includes || [],
    not_includes: trip.notIncludes || [],
    pickup_points: trip.pickupPoints || [],
    things_to_carry: trip.thingsToCarry || [],
    medical_disclaimer: trip.medicalDisclaimer || [],
    rules: trip.rules || [],
    featured: trip.featured || false,
    archived: false,
  };

  const { error: tripUpsertError } = await supabaseAdmin
    .from("trips")
    .upsert(tripRow, {
      onConflict: "id",
    });

  if (tripUpsertError) {
    throw tripUpsertError;
  }

  const batchRows = (trip.batches || []).map((batch) => ({
    id: batch.id,
    trip_id: trip.id,
    departure_date: batch.departureDate,
    return_date: batch.returnDate,
    price: batch.price,
    total_seats: batch.totalSeats,
    booked_seats: batch.bookedSeats || 0,
    payment_mode: batch.paymentMode,
    advance_amount: batch.advanceAmount || 0,
    balance_due_date: batch.balanceDueDate || null,
    status: batch.status,
    visibility: batch.visibility,
    booking_enabled: batch.bookingEnabled,
  }));

  if (batchRows.length > 0) {
    const { error: batchUpsertError } = await supabaseAdmin
      .from("trip_batches")
      .upsert(batchRows, {
        onConflict: "id",
      });

    if (batchUpsertError) {
      throw batchUpsertError;
    }
  }

  // Delete only departures removed from THIS trip.
  const incomingBatchIds = new Set(batchRows.map((batch) => batch.id));

  const { data: existingBatches, error: existingBatchesError } =
    await supabaseAdmin
      .from("trip_batches")
      .select("id")
      .eq("trip_id", trip.id);

  if (existingBatchesError) {
    throw existingBatchesError;
  }

  const batchIdsToDelete = (existingBatches || [])
    .map((row) => row.id as string)
    .filter((id) => !incomingBatchIds.has(id));

  if (batchIdsToDelete.length > 0) {
    const { error: deleteBatchesError } = await supabaseAdmin
      .from("trip_batches")
      .delete()
      .in("id", batchIdsToDelete);

    if (deleteBatchesError) {
      throw deleteBatchesError;
    }
  }

  return {
    tripsSaved: 1,
    batchesSaved: batchRows.length,
  };
}

export async function PUT(request: Request) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  try {
    const body = (await request.json()) as TripData | TripData[];

    // Backward compatibility only. New Admin sends exactly one trip.
    if (Array.isArray(body)) {
      for (const trip of body) {
        await saveSingleTrip(trip);
      }

      return Response.json({
        ok: true,
        tripsSaved: body.length,
        mode: "legacy-array",
      });
    }

    if (!body || typeof body !== "object" || !body.id || !body.slug) {
      return Response.json(
        { error: "A valid trip object is required." },
        { status: 400 }
      );
    }

    const result = await saveSingleTrip(body);

    return Response.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("PUT /api/trips failed:", error);

    const details = getErrorDetails(error);

    return Response.json(
      {
        error: details.message,
        code: details.code,
        details: details.details,
        hint: details.hint,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  try {
    const url = new URL(request.url);
    const tripId = url.searchParams.get("id")?.trim() || "";

    if (!tripId) {
      return Response.json(
        { error: "Trip id is required." },
        { status: 400 }
      );
    }

    /*
     * Permanent admin behavior: soft-delete instead of physically deleting.
     * This preserves bookings/payments/history and avoids foreign-key failures.
     */
    const { error: hideBatchesError } = await supabaseAdmin
      .from("trip_batches")
      .update({
        status: "CLOSED",
        visibility: "HIDDEN",
        booking_enabled: false,
      })
      .eq("trip_id", tripId);

    if (hideBatchesError) {
      throw hideBatchesError;
    }

    const { data: archivedTrip, error: archiveTripError } =
      await supabaseAdmin
        .from("trips")
        .update({
          archived: true,
          featured: false,
        })
        .eq("id", tripId)
        .select("id")
        .maybeSingle();

    if (archiveTripError) {
      throw archiveTripError;
    }

    if (!archivedTrip) {
      return Response.json(
        { error: "Trip not found." },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      deletedTripId: tripId,
      archived: true,
    });
  } catch (error) {
    console.error("DELETE /api/trips failed:", error);

    const details = getErrorDetails(error);

    return Response.json(
      {
        error: details.message,
        code: details.code,
        details: details.details,
        hint: details.hint,
      },
      { status: 500 }
    );
  }
}
