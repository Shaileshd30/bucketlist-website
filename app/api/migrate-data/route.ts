import { promises as fs } from "fs";
import path from "path";

import { supabaseAdmin } from "@/lib/supabase-server";

import type { TripData } from "@/app/data/trips";
import type { Coupon } from "@/app/data/coupons";

export const dynamic = "force-dynamic";

const tripsPath = path.join(
  process.cwd(),
  "app",
  "data",
  "trips.json"
);

const couponsPath = path.join(
  process.cwd(),
  "app",
  "data",
  "coupons.json"
);

async function readJsonFile<T>(
  filePath: string,
  fallback: T
): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Could not read ${filePath}:`, error);
    return fallback;
  }
}

export async function POST() {
  try {
    const trips = await readJsonFile<TripData[]>(
      tripsPath,
      []
    );

    const coupons = await readJsonFile<Coupon[]>(
      couponsPath,
      []
    );

    if (trips.length === 0) {
      return Response.json(
        {
          ok: false,
          error: "No trips found in trips.json.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================================
    // 1. MIGRATE TRIPS
    // ============================================================

    const tripRows = trips.map((trip) => ({
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

      image: trip.image || "",

      gallery: trip.gallery || [],
      itinerary: trip.itinerary || [],

      includes: trip.includes || [],
      not_includes: trip.notIncludes || [],

      pickup_points: trip.pickupPoints || [],
      things_to_carry: trip.thingsToCarry || [],

      medical_disclaimer:
        trip.medicalDisclaimer || [],

      rules: trip.rules || [],

      featured: trip.featured || false,
    }));

    const {
      error: tripsError,
    } = await supabaseAdmin
      .from("trips")
      .upsert(tripRows, {
        onConflict: "id",
      });

    if (tripsError) {
      console.error(
        "Trip migration failed:",
        tripsError
      );

      return Response.json(
        {
          ok: false,
          stage: "trips",
          error: tripsError.message,
        },
        {
          status: 500,
        }
      );
    }

    // ============================================================
    // 2. MIGRATE TRIP BATCHES
    // ============================================================

    const batchRows = trips.flatMap((trip) =>
      (trip.batches || []).map((batch) => ({
        id: batch.id,

        trip_id: trip.id,

        departure_date:
          batch.departureDate,

        return_date:
          batch.returnDate,

        price: batch.price,

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
      }))
    );

    if (batchRows.length > 0) {
      const {
        error: batchesError,
      } = await supabaseAdmin
        .from("trip_batches")
        .upsert(batchRows, {
          onConflict: "id",
        });

      if (batchesError) {
        console.error(
          "Batch migration failed:",
          batchesError
        );

        return Response.json(
          {
            ok: false,
            stage: "trip_batches",
            error:
              batchesError.message,
          },
          {
            status: 500,
          }
        );
      }
    }

    // ============================================================
    // 3. MIGRATE COUPONS
    // ============================================================

    const couponRows = coupons.map(
      (coupon) => ({
        id: coupon.id,

        code: coupon.code
          .trim()
          .toUpperCase(),

        description:
          coupon.description || null,

        discount_type:
          coupon.discountType,

        discount_value:
          coupon.discountValue,

        minimum_booking_amount:
          coupon.minimumBookingAmount ??
          null,

        maximum_discount:
          coupon.maximumDiscount ??
          null,

        valid_from:
          coupon.validFrom || null,

        valid_until:
          coupon.validUntil || null,

        usage_limit:
          coupon.usageLimit ?? null,

        used_count:
          coupon.usedCount || 0,

        status:
          coupon.status,

        scope:
          coupon.scope,
      })
    );

    if (couponRows.length > 0) {
      const {
        error: couponsError,
      } = await supabaseAdmin
        .from("coupons")
        .upsert(couponRows, {
          onConflict: "id",
        });

      if (couponsError) {
        console.error(
          "Coupon migration failed:",
          couponsError
        );

        return Response.json(
          {
            ok: false,
            stage: "coupons",
            error:
              couponsError.message,
          },
          {
            status: 500,
          }
        );
      }
    }

    // ============================================================
    // 4. MIGRATE COUPON ↔ TRIP RELATIONS
    // ============================================================

    /*
     * Clear current mappings first.
     *
     * We are doing this only for migration so the
     * database accurately reflects coupons.json.
     */
    const {
      error: deleteRelationsError,
    } = await supabaseAdmin
      .from("coupon_trips")
      .delete()
      .not("coupon_id", "is", null);

    if (deleteRelationsError) {
      console.error(
        "Could not clear coupon trip mappings:",
        deleteRelationsError
      );

      return Response.json(
        {
          ok: false,
          stage:
            "coupon_trips_cleanup",
          error:
            deleteRelationsError.message,
        },
        {
          status: 500,
        }
      );
    }

    const slugToTripId = new Map(
      trips.map((trip) => [
        trip.slug,
        trip.id,
      ])
    );

    const couponTripRows =
      coupons.flatMap((coupon) => {
        if (
          coupon.scope !==
          "SELECTED_TRIPS"
        ) {
          return [];
        }

        return (
          coupon.allowedTripSlugs || []
        )
          .map((slug) => {
            const tripId =
              slugToTripId.get(slug);

            if (!tripId) {
              console.warn(
                `Coupon ${coupon.code}: trip slug "${slug}" not found.`
              );

              return null;
            }

            return {
              coupon_id: coupon.id,
              trip_id: tripId,
            };
          })
          .filter(
            (
              item
            ): item is {
              coupon_id: string;
              trip_id: string;
            } => item !== null
          );
      });

    if (
      couponTripRows.length > 0
    ) {
      const {
        error:
          couponTripsError,
      } = await supabaseAdmin
        .from("coupon_trips")
        .upsert(
          couponTripRows,
          {
            onConflict:
              "coupon_id,trip_id",
          }
        );

      if (couponTripsError) {
        console.error(
          "Coupon trip migration failed:",
          couponTripsError
        );

        return Response.json(
          {
            ok: false,
            stage:
              "coupon_trips",
            error:
              couponTripsError.message,
          },
          {
            status: 500,
          }
        );
      }
    }

    // ============================================================
    // 5. VERIFY COUNTS
    // ============================================================

    const [
      tripsCount,
      batchesCount,
      couponsCount,
      couponTripsCount,
    ] = await Promise.all([
      supabaseAdmin
        .from("trips")
        .select("*", {
          count: "exact",
          head: true,
        }),

      supabaseAdmin
        .from("trip_batches")
        .select("*", {
          count: "exact",
          head: true,
        }),

      supabaseAdmin
        .from("coupons")
        .select("*", {
          count: "exact",
          head: true,
        }),

      supabaseAdmin
        .from("coupon_trips")
        .select("*", {
          count: "exact",
          head: true,
        }),
    ]);

    return Response.json({
      ok: true,

      message:
        "Migration completed successfully.",

      source: {
        trips:
          trips.length,

        batches:
          batchRows.length,

        coupons:
          coupons.length,

        couponTripRelations:
          couponTripRows.length,
      },

      database: {
        trips:
          tripsCount.count ?? 0,

        batches:
          batchesCount.count ?? 0,

        coupons:
          couponsCount.count ??
          0,

        couponTripRelations:
          couponTripsCount.count ??
          0,
      },
    });
  } catch (error) {
    console.error(
      "Data migration failed:",
      error
    );

    return Response.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown migration error.",
      },
      {
        status: 500,
      }
    );
  }
}