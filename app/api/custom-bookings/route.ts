import type {
  CreateCustomBookingInput,
  CustomBooking,
  CustomBookingStatus,
  CustomPaymentStatus,
} from "@/app/data/custom-bookings";
import { requireAdmin } from "@/lib/admin-auth";
import { readLimitedJsonObject } from "@/lib/request-json";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type CustomBookingRow = {
  id: string;
  booking_reference: string;
  package_name: string;
  customer_name: string;
  phone: string;
  email: string;
  travel_start_date: string | null;
  travel_end_date: string | null;
  travelers: number;
  total_amount: number | string;
  advance_amount: number | string;
  amount_paid: number | string;
  balance_amount: number | string;
  balance_due_date: string | null;
  booking_status: CustomBookingStatus;
  payment_status: CustomPaymentStatus;
  razorpay_payment_link_id: string | null;
  razorpay_payment_link_url: string | null;
  payment_link_expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapCustomBooking(
  row: CustomBookingRow
): CustomBooking {
  return {
    id: row.id,
    bookingReference:
      row.booking_reference,
    packageName: row.package_name,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    travelStartDate:
      row.travel_start_date || undefined,
    travelEndDate:
      row.travel_end_date || undefined,
    travelers: row.travelers,
    totalAmount:
      Number(row.total_amount),
    advanceAmount:
      Number(row.advance_amount),
    amountPaid:
      Number(row.amount_paid),
    balanceAmount:
      Number(row.balance_amount),
    balanceDueDate:
      row.balance_due_date || undefined,
    bookingStatus:
      row.booking_status,
    paymentStatus:
      row.payment_status,
    razorpayPaymentLinkId:
      row.razorpay_payment_link_id ||
      undefined,
    razorpayPaymentLinkUrl:
      row.razorpay_payment_link_url ||
      undefined,
    paymentLinkExpiresAt:
      row.payment_link_expires_at ||
      undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requiredText(
  value: unknown,
  minimumLength: number,
  maximumLength: number
) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  if (
    text.length < minimumLength ||
    text.length > maximumLength
  ) {
    return null;
  }

  return text;
}

function optionalText(
  value: unknown,
  maximumLength: number
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();

  if (text.length > maximumLength) {
    return undefined;
  }

  return text || null;
}

function optionalDate(
  value: unknown
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return undefined;
  }

  const timestamp =
    new Date(
      `${value}T00:00:00Z`
    ).getTime();

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return value;
}

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
      .from("custom_bookings")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return Response.json(
      {
        bookings:
          (
            (data || []) as CustomBookingRow[]
          ).map(mapCustomBooking),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/custom-bookings failed:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to load custom bookings.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

export async function POST(
  request: Request
) {
  const authError =
    await requireAdmin();

  if (authError) {
    return authError;
  }

  const bodyResult =
    await readLimitedJsonObject(
      request,
      16 * 1024
    );

  if (!bodyResult.ok) {
    return Response.json(
      {
        error: bodyResult.error,
      },
      {
        status: bodyResult.status,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const body =
    bodyResult.value as unknown as Partial<CreateCustomBookingInput>;

  const packageName =
    requiredText(
      body.packageName,
      2,
      200
    );

  const customerName =
    requiredText(
      body.customerName,
      2,
      150
    );

  const phone =
    requiredText(
      body.phone,
      7,
      32
    );

  const email =
    requiredText(
      body.email,
      3,
      320
    );

  const travelStartDate =
    optionalDate(
      body.travelStartDate
    );

  const travelEndDate =
    optionalDate(
      body.travelEndDate
    );

  const balanceDueDate =
    optionalDate(
      body.balanceDueDate
    );

  const notes =
    optionalText(
      body.notes,
      5000
    );

  const travelers =
    Number(body.travelers);

  const totalAmount =
    Number(body.totalAmount);

  const advanceAmount =
    Number(body.advanceAmount);

  if (
    !packageName ||
    !customerName ||
    !phone ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return Response.json(
      {
        error:
          "Valid package and customer details are required.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  if (
    travelStartDate === undefined ||
    travelEndDate === undefined ||
    balanceDueDate === undefined ||
    notes === undefined
  ) {
    return Response.json(
      {
        error:
          "One or more optional fields are invalid.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  if (
    !Number.isInteger(travelers) ||
    travelers < 1 ||
    travelers > 200
  ) {
    return Response.json(
      {
        error:
          "Travelers must be between 1 and 200.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  if (
    !Number.isFinite(totalAmount) ||
    totalAmount <= 0 ||
    !Number.isFinite(advanceAmount) ||
    advanceAmount <= 0 ||
    advanceAmount > totalAmount
  ) {
    return Response.json(
      {
        error:
          "Valid total and advance amounts are required.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  if (
    travelStartDate &&
    travelEndDate &&
    travelEndDate < travelStartDate
  ) {
    return Response.json(
      {
        error:
          "Travel end date cannot be before the start date.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  if (
    balanceDueDate &&
    travelStartDate &&
    balanceDueDate > travelStartDate
  ) {
    return Response.json(
      {
        error:
          "Balance due date cannot be after the travel start date.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  try {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("custom_bookings")
      .insert({
        package_name: packageName,
        customer_name: customerName,
        phone,
        email,
        travel_start_date:
          travelStartDate,
        travel_end_date:
          travelEndDate,
        travelers,
        total_amount:
          totalAmount,
        advance_amount:
          advanceAmount,
        balance_due_date:
          balanceDueDate,
        notes,
        booking_status: "DRAFT",
        payment_status: "PENDING",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return Response.json(
      {
        booking:
          mapCustomBooking(
            data as CustomBookingRow
          ),
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "POST /api/custom-bookings failed:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to create custom booking.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}