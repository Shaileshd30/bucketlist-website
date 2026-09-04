import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

import type { Booking } from "@/app/data/bookings";

export const dynamic = "force-dynamic";

type CreateBookingRequest = {
  tripId: string;
  tripSlug: string;
  batchId: string;

  customerName: string;
  phone: string;
  email: string;

  travelers: number;

  couponCode?: string;
};

type TripRow = {
  id: string;
  slug: string;
  title: string;
};

type BatchRow = {
  id: string;
  trip_id: string;

  departure_date: string;
  return_date: string;

  price: number | string;

  total_seats: number;
  booked_seats: number;

  payment_mode:
    | "FULL"
    | "ADVANCE";

  advance_amount:
    | number
    | string;

  balance_due_date:
    | string
    | null;

  status: string;
  visibility: string;

  booking_enabled: boolean;
};

type CouponRow = {
  id: string;
  code: string;

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

  valid_from:
    | string
    | null;

  valid_until:
    | string
    | null;

  usage_limit:
    | number
    | null;

  used_count: number;

  status:
    | "ACTIVE"
    | "INACTIVE";

  scope:
    | "ALL_TRIPS"
    | "SELECTED_TRIPS";
};

type BookingRow = {
  id: string;
  booking_id: string;

  trip_id: string;
  trip_slug: string;
  trip_title: string;

  batch_id: string;

  departure_date: string;
  return_date: string;

  customer_name: string;
  phone: string;
  email: string;

  travelers: number;

  price_per_person:
    | number
    | string;

  subtotal:
    | number
    | string;

  coupon_code:
    | string
    | null;

  discount_amount:
    | number
    | string;

  total_amount:
    | number
    | string;

  payment_mode:
    | "FULL"
    | "ADVANCE";

  amount_payable_now:
    | number
    | string;

  payment_status: string;
  booking_status: string;

  razorpay_order_id?:
    | string
    | null;

  razorpay_payment_id?:
    | string
    | null;

  payment_created_at?:
    | string
    | null;

  payment_verified_at?:
    | string
    | null;

  created_at: string;
  updated_at: string;
};

function normalizeCode(
  code: string
) {
  return code
    .trim()
    .toUpperCase();
}

function calculateCouponDiscount(
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
    (
      bookingAmount *
      discountValue
    ) / 100;

  const maximumDiscount =
    coupon.maximum_discount !== null
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

function mapBooking(
  row: BookingRow
): Booking {
  return {
    id: row.id,

    bookingId:
      row.booking_id,

    tripId:
      row.trip_id,

    tripSlug:
      row.trip_slug,

    tripTitle:
      row.trip_title,

    batchId:
      row.batch_id,

    departureDate:
      row.departure_date,

    returnDate:
      row.return_date,

    customerName:
      row.customer_name,

    phone:
      row.phone,

    email:
      row.email,

    travelers:
      row.travelers,

    pricePerPerson:
      Number(
        row.price_per_person
      ),

    subtotal:
      Number(
        row.subtotal
      ),

    couponCode:
      row.coupon_code ||
      undefined,

    discountAmount:
      Number(
        row.discount_amount
      ),

    totalAmount:
      Number(
        row.total_amount
      ),

    paymentMode:
      row.payment_mode,

    amountPayableNow:
      Number(
        row.amount_payable_now
      ),

    paymentStatus:
      row.payment_status as Booking["paymentStatus"],

    bookingStatus:
      row.booking_status as Booking["bookingStatus"],

    razorpayOrderId:
      row.razorpay_order_id ||
      undefined,

    razorpayPaymentId:
      row.razorpay_payment_id ||
      undefined,

    paymentCreatedAt:
      row.payment_created_at ||
      undefined,

    paymentConfirmedAt:
  row.payment_verified_at ||
  undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/*
 * Generate:
 *
 * BLA-260825-0001
 * BLA-260825-0002
 * ...
 */
async function generateBookingId() {
  const now =
    new Date();

  const yy =
    String(
      now.getFullYear()
    ).slice(-2);

  const mm =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dd =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  const prefix =
    `BLA-${yy}${mm}${dd}`;

  /*
   * Read today's booking IDs
   * directly from Supabase.
   */
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("bookings")
    .select("booking_id")
    .like(
      "booking_id",
      `${prefix}-%`
    );

  if (error) {
    throw error;
  }

  const existingNumbers =
    (data || [])
      .map((booking) => {
        const bookingId =
          String(
            booking.booking_id ||
            ""
          );

        const parts =
          bookingId.split("-");

        return Number(
          parts[
            parts.length - 1
          ]
        );
      })
      .filter(
        Number.isFinite
      );

  const nextNumber =
    existingNumbers.length > 0
      ? Math.max(
          ...existingNumbers
        ) + 1
      : 1;

  return `${prefix}-${String(
    nextNumber
  ).padStart(4, "0")}`;
}

/*
 * =========================================================
 * GET BOOKINGS
 * =========================================================
 */

export async function GET() {
  const authError =
    await requireAdmin();

  if (authError) {
    return authError;
  }

  try {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    const bookings =
      (
        (data || []) as BookingRow[]
      ).map(
        mapBooking
      );

    return Response.json(
      bookings,
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/bookings failed:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load bookings.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * CREATE BOOKING
 * =========================================================
 */

export async function POST(
  request: Request
) {
  try {
    let body: CreateBookingRequest;

try {
  const parsedBody: unknown =
    await request.json();

  if (
    parsedBody === null ||
    typeof parsedBody !== "object" ||
    Array.isArray(parsedBody)
  ) {
    return Response.json(
      {
        error:
          "Invalid JSON request body.",
      },
      {
        status: 400,
      }
    );
  }

  body =
    parsedBody as CreateBookingRequest;
} catch {
  return Response.json(
    {
      error:
        "Invalid JSON request body.",
    },
    {
      status: 400,
    }
  );
}

    /*
     * -----------------------------------------------------
     * 1. BASIC VALIDATION
     * -----------------------------------------------------
     */

    if (
  typeof body.tripId !== "string" ||
  !body.tripId.trim() ||
  typeof body.tripSlug !== "string" ||
  !body.tripSlug.trim() ||
  typeof body.batchId !== "string" ||
  !body.batchId.trim() ||
  typeof body.customerName !== "string" ||
  !body.customerName.trim() ||
  typeof body.phone !== "string" ||
  !body.phone.trim() ||
  typeof body.email !== "string" ||
  !body.email.trim()
) {
      return Response.json(
        {
          error:
            "Required booking details are missing.",
        },
        {
          status: 400,
        }
      );
    }

    const travelers =
      Number(
        body.travelers
      );

    if (
  !Number.isInteger(
    travelers
  ) ||
  travelers < 1 ||
  travelers > 100
) {
      return Response.json(
        {
          error:
            "Invalid traveler count.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -----------------------------------------------------
     * 2. LOAD TRIP FROM SUPABASE
     * -----------------------------------------------------
     */

    const {
      data: tripData,
      error: tripError,
    } = await supabaseAdmin
      .from("trips")
      .select(
        "id, slug, title"
      )
      .eq(
        "id",
        body.tripId
      )
      .eq(
        "slug",
        body.tripSlug
      )
      .maybeSingle();

    if (tripError) {
      throw tripError;
    }

    if (!tripData) {
      return Response.json(
        {
          error:
            "Trip could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const trip =
      tripData as TripRow;

    /*
     * -----------------------------------------------------
     * 3. LOAD DEPARTURE FROM SUPABASE
     * -----------------------------------------------------
     */

    const {
      data: batchData,
      error: batchError,
    } = await supabaseAdmin
      .from("trip_batches")
      .select("*")
      .eq(
        "id",
        body.batchId
      )
      .eq(
        "trip_id",
        trip.id
      )
      .maybeSingle();

    if (batchError) {
      throw batchError;
    }

    if (!batchData) {
      return Response.json(
        {
          error:
            "Departure could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const batch =
      batchData as BatchRow;

    /*
     * -----------------------------------------------------
     * 4. CHECK WHETHER DEPARTURE IS BOOKABLE
     * -----------------------------------------------------
     */

    if (
      batch.status !==
        "OPEN" ||
      batch.visibility !==
        "PUBLIC" ||
      !batch.booking_enabled
    ) {
      return Response.json(
        {
          error:
            "This departure is not available for online booking.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -----------------------------------------------------
     * 5. CHECK SEATS
     * -----------------------------------------------------
     */

    const totalSeats =
      Number(
        batch.total_seats
      );

    const bookedSeats =
      Number(
        batch.booked_seats ||
        0
      );

    const availableSeats =
      Math.max(
        0,
        totalSeats -
          bookedSeats
      );

    if (
      availableSeats <
      travelers
    ) {
      return Response.json(
        {
          error: `Only ${availableSeats} seat${
            availableSeats === 1
              ? ""
              : "s"
          } are currently available.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -----------------------------------------------------
     * 6. CALCULATE PRICE ON SERVER
     * -----------------------------------------------------
     */

    const pricePerPerson =
      Number(
        batch.price
      );

    if (
      !Number.isFinite(
        pricePerPerson
      ) ||
      pricePerPerson <= 0
    ) {
      return Response.json(
        {
          error:
            "Invalid departure price.",
        },
        {
          status: 400,
        }
      );
    }

    const subtotal =
      pricePerPerson *
      travelers;

    let couponCode:
      string | undefined;

    let discountAmount =
      0;

    /*
     * -----------------------------------------------------
     * 7. VALIDATE COUPON AGAIN ON SERVER
     * -----------------------------------------------------
     *
     * Never trust only the coupon result shown in the
     * browser.
     */

    if (
      body.couponCode
    ) {
      const normalizedCode =
        normalizeCode(
          body.couponCode
        );

      const {
        data: couponData,
        error: couponError,
      } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq(
          "code",
          normalizedCode
        )
        .maybeSingle();

      if (couponError) {
        throw couponError;
      }

      if (!couponData) {
        return Response.json(
          {
            error:
              "The selected coupon is no longer valid.",
          },
          {
            status: 400,
          }
        );
      }

      const coupon =
        couponData as CouponRow;

      /*
       * Coupon status
       */
      if (
        coupon.status !==
        "ACTIVE"
      ) {
        return Response.json(
          {
            error:
              "This coupon is inactive.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Coupon start date
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
          return Response.json(
            {
              error:
                "This coupon is not active yet.",
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * Coupon expiry
       */
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
          return Response.json(
            {
              error:
                "This coupon has expired.",
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * Coupon usage limit
       */
      if (
        coupon.usage_limit !==
          null &&
        coupon.used_count >=
          coupon.usage_limit
      ) {
        return Response.json(
          {
            error:
              "This coupon has reached its usage limit.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Minimum booking amount
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
          subtotal <
          minimumAmount
        ) {
          return Response.json(
            {
              error:
                `Minimum booking amount for this coupon is ₹${minimumAmount.toLocaleString(
                  "en-IN"
                )}.`,
            },
            {
              status: 400,
            }
          );
        }
      }

      /*
       * Selected-trip coupon
       */
      if (
        coupon.scope ===
        "SELECTED_TRIPS"
      ) {
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
            trip.id
          )
          .maybeSingle();

        if (
          relationError
        ) {
          throw relationError;
        }

        if (!relation) {
          return Response.json(
            {
              error:
                "This coupon is not valid for this trip.",
            },
            {
              status: 400,
            }
          );
        }
      }

      couponCode =
        coupon.code;

      discountAmount =
        Math.round(
          calculateCouponDiscount(
            coupon,
            subtotal
          )
        );
    }

    /*
     * -----------------------------------------------------
     * 8. FINAL TOTAL
     * -----------------------------------------------------
     */

    const totalAmount =
      Math.max(
        0,
        subtotal -
          discountAmount
      );

    /*
     * -----------------------------------------------------
     * 9. PAYMENT AMOUNT
     * -----------------------------------------------------
     */

    const advancePerPerson =
      Number(
        batch.advance_amount ||
        0
      );

    const normalAdvance =
      advancePerPerson *
      travelers;

    const amountPayableNow =
      batch.payment_mode ===
      "ADVANCE"
        ? Math.min(
            normalAdvance,
            totalAmount
          )
        : totalAmount;

    if (
      !Number.isFinite(
        amountPayableNow
      ) ||
      amountPayableNow < 0
    ) {
      return Response.json(
        {
          error:
            "Invalid payment amount.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -----------------------------------------------------
     * 10. GENERATE BOOKING ID
     * -----------------------------------------------------
     */

    const bookingId =
      await generateBookingId();

    const now =
      new Date().toISOString();

    const internalId =
      `booking-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    /*
     * -----------------------------------------------------
     * 11. INSERT BOOKING INTO SUPABASE
     * -----------------------------------------------------
     */

    const bookingRow = {
      id:
        internalId,

      booking_id:
        bookingId,

      trip_id:
        trip.id,

      trip_slug:
        trip.slug,

      trip_title:
        trip.title,

      batch_id:
        batch.id,

      departure_date:
        batch.departure_date,

      return_date:
        batch.return_date,

      customer_name:
        body.customerName
          .trim(),

      phone:
        body.phone
          .trim(),

      email:
        body.email
          .trim()
          .toLowerCase(),

      travelers,

      price_per_person:
        pricePerPerson,

      subtotal,

      coupon_code:
        couponCode ||
        null,

      discount_amount:
        discountAmount,

      total_amount:
        totalAmount,

      payment_mode:
        batch.payment_mode,

      amount_payable_now:
        amountPayableNow,

      payment_status:
        "PENDING",

      booking_status:
        "PENDING",

      created_at:
        now,

      updated_at:
        now,
    };

    const {
      data:
        insertedBookingData,

      error:
        bookingInsertError,
    } = await supabaseAdmin
      .from("bookings")
      .insert(
        bookingRow
      )
      .select("*")
      .single();

    if (
      bookingInsertError
    ) {
      /*
       * booking_id should have a UNIQUE
       * constraint in Supabase.
       */
      console.error(
        "Supabase booking insert failed:",
        bookingInsertError
      );

      throw bookingInsertError;
    }

    const booking =
      mapBooking(
        insertedBookingData as BookingRow
      );

    /*
     * IMPORTANT:
     *
     * We DO NOT increase booked_seats here.
     *
     * A booking has only been created.
     * Payment has NOT yet been verified.
     *
     * booked_seats will be increased by
     * /api/payments/verify after Razorpay
     * payment verification succeeds.
     *
     * We also DO NOT increase coupon used_count
     * here for the same reason.
     */

    return Response.json(
      {
        ok: true,
        booking,
      },
      {
        status: 201,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "POST /api/bookings failed:",
      error
    );

    return Response.json(
  {
    error:
      "Unable to create booking right now.",
  },
  {
    status: 500,
  }
);
}
}