import { supabaseAdmin } from "@/lib/supabase-server";

import { requireAdmin } from "@/lib/admin-auth";

import type {
  Coupon,
  CouponScope,
  CouponStatus,
  DiscountType,
} from "@/app/data/coupons";

export const dynamic = "force-dynamic";

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number | string;
  minimum_booking_amount: number | string | null;
  maximum_discount: number | string | null;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  status: CouponStatus;
  scope: CouponScope;
  created_at: string;
  updated_at: string;
};

type CouponTripRow = {
  coupon_id: string;
  trip_id: string;
};

type TripLookupRow = {
  id: string;
  slug: string;
};

function mapCoupon(
  row: CouponRow,
  allowedTripSlugs: string[]
): Coupon {
  return {
    id: row.id,
    code: row.code,

    description:
      row.description || undefined,

    discountType:
      row.discount_type,

    discountValue:
      Number(row.discount_value),

    minimumBookingAmount:
      row.minimum_booking_amount !== null
        ? Number(row.minimum_booking_amount)
        : undefined,

    maximumDiscount:
      row.maximum_discount !== null
        ? Number(row.maximum_discount)
        : undefined,

    validFrom:
      row.valid_from || undefined,

    validUntil:
      row.valid_until || undefined,

    usageLimit:
      row.usage_limit ?? undefined,

    usedCount:
      row.used_count || 0,

    status:
      row.status,

    scope:
      row.scope,

    allowedTripSlugs:
      row.scope === "SELECTED_TRIPS"
        ? allowedTripSlugs
        : undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

export async function GET() {
  try {
    const [
      couponsResult,
      couponTripsResult,
      tripsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("coupons")
        .select("*")
        .order("created_at", {
          ascending: true,
        }),

      supabaseAdmin
        .from("coupon_trips")
        .select("coupon_id, trip_id"),

      supabaseAdmin
        .from("trips")
        .select("id, slug"),
    ]);

    if (couponsResult.error) {
      throw couponsResult.error;
    }

    if (couponTripsResult.error) {
      throw couponTripsResult.error;
    }

    if (tripsResult.error) {
      throw tripsResult.error;
    }

    const couponRows =
      (couponsResult.data || []) as CouponRow[];

    const relationRows =
      (couponTripsResult.data || []) as CouponTripRow[];

    const tripRows =
      (tripsResult.data || []) as TripLookupRow[];

    const tripIdToSlug =
      new Map<string, string>(
        tripRows.map((trip) => [
          trip.id,
          trip.slug,
        ])
      );

    const couponToTripSlugs =
      new Map<string, string[]>();

    for (const relation of relationRows) {
      const slug =
        tripIdToSlug.get(
          relation.trip_id
        );

      if (!slug) {
        continue;
      }

      const existing =
        couponToTripSlugs.get(
          relation.coupon_id
        ) || [];

      existing.push(slug);

      couponToTripSlugs.set(
        relation.coupon_id,
        existing
      );
    }

    const coupons =
      couponRows.map((row) =>
        mapCoupon(
          row,
          couponToTripSlugs.get(
            row.id
          ) || []
        )
      );

    return Response.json(
      coupons,
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/coupons failed:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load coupons.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: Request) {
  const authError =
    await requireAdmin();

  if (authError) {
    return authError;
  }

  try {
    const body =
      (await request.json()) as Coupon[];

    if (!Array.isArray(body)) {
      return Response.json(
        {
          error:
            "Coupon data must be an array.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      new Date().toISOString();

    const normalizedCoupons =
      body.map((coupon) => ({
        ...coupon,

        code:
          coupon.code
            .trim()
            .toUpperCase(),

        updatedAt: now,
      }));

    /*
     * --------------------------------
     * 1. UPSERT COUPONS
     * --------------------------------
     */
    const couponRows =
      normalizedCoupons.map(
        (coupon) => ({
          id: coupon.id,

          code:
            coupon.code,

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
            coupon.usageLimit ??
            null,

          used_count:
            coupon.usedCount || 0,

          status:
            coupon.status,

          scope:
            coupon.scope,

          updated_at:
            coupon.updatedAt,
        })
      );

    if (couponRows.length > 0) {
      const {
        error:
          couponUpsertError,
      } = await supabaseAdmin
        .from("coupons")
        .upsert(
          couponRows,
          {
            onConflict: "id",
          }
        );

      if (couponUpsertError) {
        throw couponUpsertError;
      }
    }

    /*
     * --------------------------------
     * 2. DELETE REMOVED COUPONS
     * --------------------------------
     */
    const incomingCouponIds =
      new Set(
        normalizedCoupons.map(
          (coupon) => coupon.id
        )
      );

    const {
      data:
        existingCoupons,
      error:
        existingCouponsError,
    } = await supabaseAdmin
      .from("coupons")
      .select("id");

    if (
      existingCouponsError
    ) {
      throw existingCouponsError;
    }

    const couponIdsToDelete =
      (existingCoupons || [])
        .map(
          (row) =>
            row.id as string
        )
        .filter(
          (id) =>
            !incomingCouponIds.has(
              id
            )
        );

    if (
      couponIdsToDelete.length >
      0
    ) {
      const {
        error:
          deleteCouponsError,
      } = await supabaseAdmin
        .from("coupons")
        .delete()
        .in(
          "id",
          couponIdsToDelete
        );

      if (
        deleteCouponsError
      ) {
        throw deleteCouponsError;
      }
    }

    /*
     * --------------------------------
     * 3. REBUILD COUPON/TRIP LINKS
     * --------------------------------
     */
    const {
      error:
        clearRelationsError,
    } = await supabaseAdmin
      .from("coupon_trips")
      .delete()
      .not(
        "coupon_id",
        "is",
        null
      );

    if (
      clearRelationsError
    ) {
      throw clearRelationsError;
    }

    const {
      data: tripRows,
      error:
        tripLookupError,
    } = await supabaseAdmin
      .from("trips")
      .select("id, slug");

    if (
      tripLookupError
    ) {
      throw tripLookupError;
    }

    const slugToTripId =
      new Map<string, string>(
        (tripRows || []).map(
          (trip) => [
            trip.slug as string,
            trip.id as string,
          ]
        )
      );

    const relationRows =
      normalizedCoupons.flatMap(
        (coupon) => {
          if (
            coupon.scope !==
            "SELECTED_TRIPS"
          ) {
            return [];
          }

          return (
            coupon.allowedTripSlugs ||
            []
          )
            .map((slug) => {
              const tripId =
                slugToTripId.get(
                  slug
                );

              if (!tripId) {
                return null;
              }

              return {
                coupon_id:
                  coupon.id,

                trip_id:
                  tripId,
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
        }
      );

    if (
      relationRows.length > 0
    ) {
      const {
        error:
          relationInsertError,
      } = await supabaseAdmin
        .from("coupon_trips")
        .upsert(
          relationRows,
          {
            onConflict:
              "coupon_id,trip_id",
          }
        );

      if (
        relationInsertError
      ) {
        throw relationInsertError;
      }
    }

    return Response.json(
      {
        ok: true,

        couponsSaved:
          normalizedCoupons.length,

        couponTripRelationsSaved:
          relationRows.length,
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
      "PUT /api/coupons failed:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save coupons.",
      },
      {
        status: 500,
      }
    );
  }
}