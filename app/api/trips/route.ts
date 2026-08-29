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
      row.image || "",

    gallery:
      row.gallery || [],

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim() || "";

    if (slug) {
      const tripResult = await supabaseAdmin
        .from("trips")
        .select("*")
        .eq("slug", slug)
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
    const [
      tripsResult,
      batchesResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("trips")
        .select("*")
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

export async function PUT(request: Request) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  try {
    const body =
      (await request.json()) as TripData[];

    if (!Array.isArray(body)) {
      return Response.json(
        {
          error:
            "Trip data must be an array.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ---------------------------------
     * 1. UPSERT TRIPS
     * ---------------------------------
     */
    const tripRows =
      body.map((trip) => ({
        id: trip.id,
        slug: trip.slug,
        title: trip.title,

        trip_type:
          trip.tripType || null,

        category:
          trip.category,

        highlight:
          trip.highlight || null,

        subtitle:
          trip.subtitle || "",

        summary:
          trip.summary || "",

        cta:
          trip.cta || "Book Now",

        difficulty:
          trip.difficulty || "",

        start_point:
          trip.startPoint || "",

        duration_days:
          trip.durationDays || null,

        group_size:
          trip.groupSize || null,

        description:
          trip.description || null,

        overview:
          trip.overview || null,

        image:
          trip.image || "",

        gallery:
          trip.gallery || [],

        itinerary:
          trip.itinerary || [],

        includes:
          trip.includes || [],

        not_includes:
          trip.notIncludes || [],

        pickup_points:
          trip.pickupPoints || [],

        things_to_carry:
          trip.thingsToCarry || [],

        medical_disclaimer:
          trip.medicalDisclaimer || [],

        rules:
          trip.rules || [],

        featured:
          trip.featured || false,
      }));

    const {
      error: tripUpsertError,
    } = await supabaseAdmin
      .from("trips")
      .upsert(
        tripRows,
        {
          onConflict: "id",
        }
      );

    if (tripUpsertError) {
      throw tripUpsertError;
    }

    /*
     * ---------------------------------
     * 2. UPSERT BATCHES
     * ---------------------------------
     */
    const batchRows =
      body.flatMap((trip) =>
        (trip.batches || []).map(
          (batch) => ({
            id: batch.id,

            trip_id:
              trip.id,

            departure_date:
              batch.departureDate,

            return_date:
              batch.returnDate,

            price:
              batch.price,

            total_seats:
              batch.totalSeats,

            booked_seats:
              batch.bookedSeats || 0,

            payment_mode:
              batch.paymentMode,

            advance_amount:
              batch.advanceAmount || 0,

            balance_due_date:
              batch.balanceDueDate || null,

            status:
              batch.status,

            visibility:
              batch.visibility,

            booking_enabled:
              batch.bookingEnabled,
          })
        )
      );

    if (batchRows.length > 0) {
      const {
        error: batchUpsertError,
      } = await supabaseAdmin
        .from("trip_batches")
        .upsert(
          batchRows,
          {
            onConflict: "id",
          }
        );

      if (batchUpsertError) {
        throw batchUpsertError;
      }
    }

    /*
     * ---------------------------------
     * 3. DELETE REMOVED BATCHES
     * ---------------------------------
     *
     * If you delete a departure from Admin,
     * remove it from Supabase too.
     */
    const incomingBatchIds =
      new Set(
        batchRows.map(
          (batch) => batch.id
        )
      );

    const {
      data: existingBatches,
      error:
        existingBatchesError,
    } = await supabaseAdmin
      .from("trip_batches")
      .select("id");

    if (existingBatchesError) {
      throw existingBatchesError;
    }

    const batchIdsToDelete =
      (existingBatches || [])
        .map((row) => row.id as string)
        .filter(
          (id) =>
            !incomingBatchIds.has(id)
        );

    if (
      batchIdsToDelete.length > 0
    ) {
      const {
        error:
          deleteBatchesError,
      } = await supabaseAdmin
        .from("trip_batches")
        .delete()
        .in(
          "id",
          batchIdsToDelete
        );

      if (deleteBatchesError) {
        throw deleteBatchesError;
      }
    }

    /*
     * ---------------------------------
     * 4. DELETE REMOVED TRIPS
     * ---------------------------------
     */
    const incomingTripIds =
      new Set(
        body.map(
          (trip) => trip.id
        )
      );

    const {
      data: existingTrips,
      error:
        existingTripsError,
    } = await supabaseAdmin
      .from("trips")
      .select("id");

    if (existingTripsError) {
      throw existingTripsError;
    }

    const tripIdsToDelete =
      (existingTrips || [])
        .map((row) => row.id as string)
        .filter(
          (id) =>
            !incomingTripIds.has(id)
        );

    if (
      tripIdsToDelete.length > 0
    ) {
      const {
        error:
          deleteTripsError,
      } = await supabaseAdmin
        .from("trips")
        .delete()
        .in(
          "id",
          tripIdsToDelete
        );

      if (deleteTripsError) {
        throw deleteTripsError;
      }
    }

    return Response.json(
      {
        ok: true,
        tripsSaved:
          body.length,

        batchesSaved:
          batchRows.length,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/trips failed:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save trip data.",
      },
      {
        status: 500,
      }
    );
  }
}