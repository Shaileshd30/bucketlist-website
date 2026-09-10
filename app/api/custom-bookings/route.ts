import type {
  CreateCustomBookingInput,
  CustomBooking,
  CustomBookingInstallment,
  CustomBookingStatus,
  CustomInstallmentStatus,
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

type CustomInstallmentRow = {
  id: string;
  custom_booking_id: string;
  installment_number: number;
  label: string;
  amount: number | string;
  due_date: string | null;
  paid_amount: number | string;
  status: CustomInstallmentStatus;
  razorpay_payment_link_id: string | null;
  razorpay_payment_link_url: string | null;
  payment_link_expires_at: string | null;
  paid_at: string | null;
};

function mapInstallment(row: CustomInstallmentRow): CustomBookingInstallment {
  return {
    id: row.id,
    installmentNumber: row.installment_number,
    label: row.label,
    amount: Number(row.amount),
    dueDate: row.due_date || undefined,
    paidAmount: Number(row.paid_amount),
    status: row.status,
    razorpayPaymentLinkId: row.razorpay_payment_link_id || undefined,
    razorpayPaymentLinkUrl: row.razorpay_payment_link_url || undefined,
    paymentLinkExpiresAt: row.payment_link_expires_at || undefined,
    paidAt: row.paid_at || undefined,
  };
}

function mapCustomBooking(
  row: CustomBookingRow,
  installments: CustomBookingInstallment[] = []
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
    installments,
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
    const [bookingsResult, installmentsResult] = await Promise.all([
      supabaseAdmin
        .from("custom_bookings")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("custom_booking_installments")
        .select("*")
        .order("installment_number", { ascending: true }),
    ]);

    if (bookingsResult.error) {
      throw bookingsResult.error;
    }

    if (installmentsResult.error) {
      throw installmentsResult.error;
    }

    const installmentRows = (installmentsResult.data || []) as CustomInstallmentRow[];
    const installmentsByBooking = new Map<string, CustomBookingInstallment[]>();

    for (const row of installmentRows) {
      const list = installmentsByBooking.get(row.custom_booking_id) || [];
      list.push(mapInstallment(row));
      installmentsByBooking.set(row.custom_booking_id, list);
    }

    return Response.json(
      {
        bookings:
          (
            (bookingsResult.data || []) as CustomBookingRow[]
          ).map((row) => mapCustomBooking(row, installmentsByBooking.get(row.id) || [])),
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

  const rawInstallments = Array.isArray(body.installments)
    ? body.installments
    : null;

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

  const installmentInputs = rawInstallments?.map((item, index) => ({
    installmentNumber: index + 1,
    label: requiredText(item?.label, 1, 80),
    amount: Number(item?.amount),
    dueDate: optionalDate(item?.dueDate),
  })) || [
    {
      installmentNumber: 1,
      label: "Installment 1",
      amount: advanceAmount,
      dueDate: null,
    },
    ...(totalAmount > advanceAmount
      ? [{
          installmentNumber: 2,
          label: "Installment 2",
          amount: totalAmount - advanceAmount,
          dueDate: balanceDueDate,
        }]
      : []),
  ];

  const installmentTotal = installmentInputs.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  if (
    installmentInputs.length < 1 ||
    installmentInputs.length > 10 ||
    installmentInputs.some(
      (item) =>
        !item.label ||
        !Number.isFinite(item.amount) ||
        item.amount <= 0 ||
        Math.abs(item.amount * 100 - Math.round(item.amount * 100)) > 1e-6 ||
        item.dueDate === undefined
    ) ||
    Math.round(installmentTotal * 100) !== Math.round(totalAmount * 100)
  ) {
    return Response.json(
      {
        error:
          "Add 1-10 valid installments whose amounts equal the package total.",
      },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const datedInstallments = installmentInputs
    .map((item) => item.dueDate)
    .filter((value): value is string => Boolean(value));

  if (
    datedInstallments.some(
      (date, index) => index > 0 && date < datedInstallments[index - 1]
    ) ||
    (travelStartDate && datedInstallments.some((date) => date > travelStartDate))
  ) {
    return Response.json(
      { error: "Installment due dates must be ordered and cannot follow the travel start date." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
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
          installmentInputs[0].amount,
        balance_due_date:
          installmentInputs.at(-1)?.dueDate || balanceDueDate,
        notes,
        booking_status: "DRAFT",
        payment_status: "PENDING",
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    const bookingRow = data as CustomBookingRow;
    const { data: installmentData, error: installmentError } =
      await supabaseAdmin
        .from("custom_booking_installments")
        .insert(
          installmentInputs.map((item) => ({
            custom_booking_id: bookingRow.id,
            installment_number: item.installmentNumber,
            label: item.label,
            amount: item.amount,
            due_date: item.dueDate,
          }))
        )
        .select("*");

    if (installmentError) {
      await supabaseAdmin.from("custom_bookings").delete().eq("id", bookingRow.id);
      throw installmentError;
    }

    const installments = ((installmentData || []) as CustomInstallmentRow[])
      .sort((a, b) => a.installment_number - b.installment_number)
      .map(mapInstallment);

    return Response.json(
      {
        booking:
          mapCustomBooking(
            bookingRow,
            installments
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
