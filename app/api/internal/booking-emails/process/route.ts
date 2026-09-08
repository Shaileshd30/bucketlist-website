import { timingSafeEqual } from "node:crypto";

import { processNextBookingEmail } from "@/lib/booking-email-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const secret = process.env.BOOKING_EMAIL_CRON_SECRET;

  if (!secret || secret.length < 32) {
    console.error("Booking email scheduler secret is not configured.");
    return json({ error: "Scheduler is not configured." }, 503);
  }

  const received = Buffer.from(
    request.headers.get("authorization") ?? "",
    "utf8"
  );

  const expected = Buffer.from(`Bearer ${secret}`, "utf8");

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return json({ error: "Unauthorized." }, 401);
  }

  try {
    const result = await processNextBookingEmail();

    const failed =
      result.status === "DELIVERY_FAILED" ||
      result.status === "DELIVERY_UNCERTAIN";

    return json(result, failed ? 503 : 200);
  } catch {
    console.error("Scheduled booking email processing failed.");
    return json({ error: "Unable to process queued email." }, 500);
  }
}