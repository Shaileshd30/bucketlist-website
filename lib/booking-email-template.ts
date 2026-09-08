export type BookingEmailKind =
  | "BOOKING_CONFIRMED"
  | "PAYMENT_UNDER_REVIEW";

type EmailPayload = {
  customerName: string;
  bookingReference: string;
  packageName: string;
  travelers: number;
  totalAmount: number;
  amountReceived: number;
  amountPaid: number;
  balanceAmount: number;
  currency: string;
  providerPaymentId: string;
  travelStartDate?: string | null;
  travelEndDate?: string | null;
  balanceDueDate?: string | null;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character];
  });
}

function readPayload(value: unknown): EmailPayload {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error("Invalid booking email payload.");
  }

  const data = value as Record<string, unknown>;

  const text = (name: string): string => {
    const field = data[name];

    if (typeof field !== "string" || !field.trim()) {
      throw new Error(`Invalid email field: ${name}`);
    }

    return field.trim();
  };

  const amount = (name: string): number => {
    const field = data[name];

    if (
      typeof field !== "number" ||
      !Number.isFinite(field) ||
      field < 0
    ) {
      throw new Error(`Invalid email amount: ${name}`);
    }

    return field;
  };

  const date = (name: string): string | null => {
    const field = data[name];

    if (field === null || field === undefined) {
      return null;
    }

    if (
      typeof field !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(field)
    ) {
      throw new Error(`Invalid email date: ${name}`);
    }

    const parsed = new Date(`${field}T00:00:00Z`);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== field
    ) {
      throw new Error(`Invalid email date: ${name}`);
    }

    return field;
  };

  const travelers = data.travelers;

  if (
    typeof travelers !== "number" ||
    !Number.isInteger(travelers) ||
    travelers < 1
  ) {
    throw new Error("Invalid traveller count.");
  }

  const currency = text("currency");

  if (currency !== "INR") {
    throw new Error("Unsupported email currency.");
  }

  return {
    customerName: text("customerName"),
    bookingReference: text("bookingReference"),
    packageName: text("packageName"),
    providerPaymentId: text("providerPaymentId"),
    travelers,
    currency,
    totalAmount: amount("totalAmount"),
    amountReceived: amount("amountReceived"),
    amountPaid: amount("amountPaid"),
    balanceAmount: amount("balanceAmount"),
    travelStartDate: date("travelStartDate"),
    travelEndDate: date("travelEndDate"),
    balanceDueDate: date("balanceDueDate"),
  };
}

function money(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formattedDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function renderBookingEmail(
  kind: BookingEmailKind,
  rawPayload: unknown
): {
  subject: string;
  text: string;
  html: string;
} {
  if (
    kind !== "BOOKING_CONFIRMED" &&
    kind !== "PAYMENT_UNDER_REVIEW"
  ) {
    throw new Error("Unsupported booking email kind.");
  }

  const booking = readPayload(rawPayload);
  const underReview = kind === "PAYMENT_UNDER_REVIEW";

  const heading = underReview
    ? "Payment received — booking under review"
    : "Your booking is confirmed";

  const introduction = underReview
    ? "We have received your payment. Your booking is not confirmed yet; our team will review it and contact you. Please do not make another payment for this booking while we review it."
    : `Thank you for booking with Bucketlist Adventure. Your booking for ${booking.packageName} is confirmed.`;

  const rows: Array<[string, string]> = [
    ["Booking reference", booking.bookingReference],
    ["Package", booking.packageName],
    ["Travellers", String(booking.travelers)],
  ];

  if (booking.travelStartDate) {
    rows.push([
      "Travel start",
      formattedDate(booking.travelStartDate),
    ]);
  }

  if (booking.travelEndDate) {
    rows.push([
      "Travel end",
      formattedDate(booking.travelEndDate),
    ]);
  }

  rows.push(
    ["Package total", money(booking.totalAmount)],
    ["Payment received", money(booking.amountReceived)],
    ["Total paid", money(booking.amountPaid)],
    [
      underReview
        ? "Remaining package amount (subject to review)"
        : "Remaining balance",
      money(booking.balanceAmount),
    ],
    ["Payment reference", booking.providerPaymentId]
  );

  if (
    !underReview &&
    booking.balanceAmount > 0 &&
    booking.balanceDueDate
  ) {
    rows.push([
      "Balance due date",
      formattedDate(booking.balanceDueDate),
    ]);
  }

  const paymentNote = underReview
    ? "This email acknowledges your payment; it does not confirm availability."
    : booking.balanceAmount === 0
      ? "Your booking is paid in full."
      : "Your advance has been received. The remaining balance is shown above.";

  const subject = `${heading} | ${booking.bookingReference}`
    .replace(/[\r\n]/g, " ");

  const text = [
    `Hello ${booking.customerName},`,
    "",
    introduction,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    paymentNote,
    "",
    "Questions? Reply to this email.",
    "",
    "Bucketlist Adventure",
    "We Plan It. You Live It.",
    "https://bucketlistadventure.in",
  ].join("\n");

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #e7e0d5;vertical-align:top;color:#627068;width:44%;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #e7e0d5;vertical-align:top;color:#17251d;word-break:break-word;">
            ${escapeHtml(value)}
          </td>
        </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#17251d;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fffdf8;">
          <tr>
            <td style="padding:28px 24px;background:#17251d;color:#ffffff;">
              <a href="https://bucketlistadventure.in" style="display:inline-block;text-decoration:none;">
  <img
    src="cid:booking-logo@bucketlistadventure.in"
    alt="Bucketlist Adventure"
    width="180"
    style="display:block;width:180px;max-width:100%;height:auto;border:0;margin:0 0 18px;"
  >
</a>
              <h1 style="margin:0;font-size:25px;line-height:1.3;">${escapeHtml(heading)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;font-size:15px;line-height:1.6;">
              <p>Hello ${escapeHtml(booking.customerName)},</p>
              <p>${escapeHtml(introduction)}</p>
              <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;border-collapse:collapse;">
                <tbody>${tableRows}</tbody>
              </table>
              <p style="margin-top:24px;">${escapeHtml(paymentNote)}</p>
              <<p>Questions? Reply to this email or contact us below.</p>

<p style="margin:20px 0 12px;line-height:1.8;">
  <strong>Bucketlist Adventure</strong><br>
  We Plan It. You Live It.<br>
  <a href="tel:+919225531257" style="color:#17251d;">
    +91 92255 31257
  </a>
  &nbsp;|&nbsp;
  <a href="https://wa.me/919225531257" style="color:#17251d;">
    WhatsApp
  </a>
</p>

<p style="margin:0 0 12px;font-size:13px;line-height:2;">
  <a href="https://www.instagram.com/bucketlistadventuure/"
     style="color:#17251d;">Instagram</a>
  &nbsp;|&nbsp;
  <a href="https://m.facebook.com/bucketlistadventures2018/"
     style="color:#17251d;">Facebook</a>
  &nbsp;|&nbsp;
  <a href="https://share.google/Q9k66ci3TGFVHkuOl"
     style="color:#17251d;">Read our reviews</a>
</p>

<p style="margin:0;font-size:13px;">
  <a href="https://bucketlistadventure.in"
     style="color:#17251d;">Visit our website</a>
</p>
              <p style="margin-bottom:0;">
                <strong>Bucketlist Adventure</strong><br>
                We Plan It. You Live It.<br>
                <a href="https://bucketlistadventure.in" style="color:#17251d;">Visit our website</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}