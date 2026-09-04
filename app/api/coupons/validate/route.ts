import { supabaseAdmin } from "@/lib/supabase-server";

type ValidateCouponRequest = {
  code?: string;
  tripSlug?: string;
  bookingAmount?: number;
};

type CouponValidationResult = {
  valid: boolean;
  code?: string;
  message: string;
  discountAmount: number;
  finalAmount: number;
};

type CouponRow = {
  id: string;
  code: string;
  description: string | null;

  discount_type:
    | "PERCENTAGE"
    | "FIXED_AMOUNT";

  discount_value:
    | number
    | string;

  minimum_booking_amount:
    | number
    | string
    | null;

  maximum_discount:
    | number
    | string
    | null;

  valid_from: string | null;
  valid_until: string | null;

  usage_limit: number | null;
  used_count: number;

  status:
    | "ACTIVE"
    | "INACTIVE";

  scope:
    | "ALL_TRIPS"
    | "SELECTED_TRIPS";
};

function normalizeCode(
  code: string
) {
  return code
    .trim()
    .toUpperCase();
}

function calculateDiscount(
  coupon: CouponRow,
  bookingAmount: number
) {
  const discountValue =
    Number(
      coupon.discount_value
    );

  if (
    coupon.discount_type ===
    "FIXED_AMOUNT"
  ) {
    return Math.min(
      discountValue,
      bookingAmount
    );
  }

  const percentageDiscount =
    (bookingAmount *
      discountValue) /
    100;

  const maximumDiscount =
    coupon.maximum_discount !==
    null
      ? Number(
          coupon.maximum_discount
        )
      : 0;

  if (
    maximumDiscount > 0
  ) {
    return Math.min(
      percentageDiscount,
      maximumDiscount
    );
  }

  return percentageDiscount;
}

export async function POST(
  request: Request
) {
  try {
    let body: ValidateCouponRequest;

    try {
      body =
        (await request.json()) as ValidateCouponRequest;
    } catch {
      return Response.json(
        {
          valid: false,

          message:
            "Invalid JSON request body.",

          discountAmount: 0,

          finalAmount: 0,
        } satisfies CouponValidationResult,
        {
          status: 400,
        }
      );
    }

    const code =
      normalizeCode(
        body.code || ""
      );

    const tripSlug =
      body.tripSlug?.trim() ||
      "";

    const bookingAmount =
      Number(
        body.bookingAmount || 0
      );

    if (!code) {
      return Response.json(
        {
          valid: false,

          message:
            "Please enter a coupon code.",

          discountAmount: 0,

          finalAmount:
            bookingAmount,
        } satisfies CouponValidationResult,
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        bookingAmount
      ) ||
      bookingAmount <= 0
    ) {
      return Response.json(
        {
          valid: false,

          message:
            "Invalid booking amount.",

          discountAmount: 0,

          finalAmount: 0,
        } satisfies CouponValidationResult,
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------
     * 1. FIND COUPON IN SUPABASE
     * --------------------------------
     */

    const {
      data: couponData,
      error: couponError,
    } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq(
        "code",
        code
      )
      .maybeSingle();

    if (couponError) {
      throw couponError;
    }

    if (!couponData) {
      return Response.json({
        valid: false,

        message:
          "Coupon code is not valid.",

        discountAmount: 0,

        finalAmount:
          bookingAmount,
      } satisfies CouponValidationResult);
    }

    const coupon =
      couponData as CouponRow;

    /*
     * --------------------------------
     * 2. STATUS
     * --------------------------------
     */

    if (
      coupon.status !==
      "ACTIVE"
    ) {
      return Response.json({
        valid: false,

        message:
          "This coupon is currently inactive.",

        discountAmount: 0,

        finalAmount:
          bookingAmount,
      } satisfies CouponValidationResult);
    }

    /*
     * --------------------------------
     * 3. DATE VALIDATION
     * --------------------------------
     */

    const now =
      new Date();

    if (
      coupon.valid_from
    ) {
      const validFrom =
        new Date(
          `${coupon.valid_from}T00:00:00`
        );

      if (
        now < validFrom
      ) {
        return Response.json({
          valid: false,

          message:
            "This coupon is not active yet.",

          discountAmount: 0,

          finalAmount:
            bookingAmount,
        } satisfies CouponValidationResult);
      }
    }

    if (
      coupon.valid_until
    ) {
      const validUntil =
        new Date(
          `${coupon.valid_until}T23:59:59`
        );

      if (
        now > validUntil
      ) {
        return Response.json({
          valid: false,

          message:
            "This coupon has expired.",

          discountAmount: 0,

          finalAmount:
            bookingAmount,
        } satisfies CouponValidationResult);
      }
    }

    /*
     * --------------------------------
     * 4. USAGE LIMIT
     * --------------------------------
     */

    if (
      coupon.usage_limit !==
        null &&
      coupon.used_count >=
        coupon.usage_limit
    ) {
      return Response.json({
        valid: false,

        message:
          "This coupon has reached its usage limit.",

        discountAmount: 0,

        finalAmount:
          bookingAmount,
      } satisfies CouponValidationResult);
    }

    /*
     * --------------------------------
     * 5. MINIMUM BOOKING VALUE
     * --------------------------------
     */

    if (
      coupon.minimum_booking_amount !==
      null
    ) {
      const minimumAmount =
        Number(
          coupon.minimum_booking_amount
        );

      if (
        bookingAmount <
        minimumAmount
      ) {
        return Response.json({
          valid: false,

          message: `Minimum booking amount for this coupon is ₹${minimumAmount.toLocaleString(
            "en-IN"
          )}.`,

          discountAmount: 0,

          finalAmount:
            bookingAmount,
        } satisfies CouponValidationResult);
      }
    }

    /*
     * --------------------------------
     * 6. SELECTED TRIP VALIDATION
     * --------------------------------
     */

    if (
      coupon.scope ===
      "SELECTED_TRIPS"
    ) {
      if (!tripSlug) {
        return Response.json({
          valid: false,

          message:
            "Trip information is required for this coupon.",

          discountAmount: 0,

          finalAmount:
            bookingAmount,
        } satisfies CouponValidationResult);
      }

      /*
       * Find the selected trip ID.
       */
      const {
        data: tripData,
        error:
          tripLookupError,
      } = await supabaseAdmin
        .from("trips")
        .select("id")
        .eq(
          "slug",
          tripSlug
        )
        .maybeSingle();

      if (
        tripLookupError
      ) {
        throw tripLookupError;
      }

      if (!tripData) {
        return Response.json({
          valid: false,

          message:
            "Selected trip could not be found.",

          discountAmount: 0,

          finalAmount:
            bookingAmount,
        } satisfies CouponValidationResult);
      }

      /*
       * Check coupon_trips relation.
       */
      const {
        data: relation,
        error:
          relationError,
      } = await supabaseAdmin
        .from(
          "coupon_trips"
        )
        .select(
          "coupon_id"
        )
        .eq(
          "coupon_id",
          coupon.id
        )
        .eq(
          "trip_id",
          tripData.id
        )
        .maybeSingle();

      if (
        relationError
      ) {
        throw relationError;
      }

      if (!relation) {
        return Response.json({
          valid: false,

          message:
            "This coupon is not valid for the selected trip.",

          discountAmount: 0,

          finalAmount:
            bookingAmount,
        } satisfies CouponValidationResult);
      }
    }

    /*
     * --------------------------------
     * 7. CALCULATE DISCOUNT
     * --------------------------------
     */

    const discountAmount =
      Math.round(
        calculateDiscount(
          coupon,
          bookingAmount
        )
      );

    const finalAmount =
      Math.max(
        0,

        bookingAmount -
          discountAmount
      );

    return Response.json({
      valid: true,

      code:
        coupon.code,

      message:
        `Coupon ${coupon.code} applied successfully.`,

      discountAmount,

      finalAmount,
    } satisfies CouponValidationResult);
  } catch (error) {
    console.error(
      "Coupon validation failed:",
      error
    );

    return Response.json(
      {
        valid: false,

        message:
          "Unable to validate the coupon right now.",

        discountAmount: 0,

        finalAmount: 0,
      } satisfies CouponValidationResult,
      {
        status: 500,
      }
    );
  }
}