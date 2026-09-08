import { requireAdmin } from "@/lib/admin-auth";
import { processNextBookingEmail } from "@/lib/booking-email-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  // Require a same-origin browser request.
  const origin = request.headers.get("origin");

  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json(
      { error: "Request origin is not allowed." },
      {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  try {
    const result = await processNextBookingEmail();

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
  console.error(
    "Booking email processing failed:",
    error instanceof Error
      ? error.message
      : "Database or unknown processing error"
  );

    return Response.json(
      { error: "Unable to process the queued email." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}