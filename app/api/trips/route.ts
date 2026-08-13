import { getTrips, saveTrip, deleteTrip, setFeatured } from "@/lib/db";
import type { TripData } from "@/app/data/trips";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trips = await getTrips();
    return Response.json(trips, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to fetch trips:", error);
    return Response.json([], {
      status: 500,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as TripData[];

    // Save all trips to database
    for (const trip of body) {
      await saveTrip(trip);
    }

    return Response.json({ ok: true }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to save trips:", error);
    return Response.json(
      { error: "Failed to save trips" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { slug } = (await request.json()) as { slug: string };

    if (!slug) {
      return Response.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    await deleteTrip(slug);

    return Response.json({ ok: true }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to delete trip:", error);
    return Response.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { slug } = (await request.json()) as { slug: string };

    if (!slug) {
      return Response.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    await setFeatured(slug);

    return Response.json({ ok: true }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to set featured trip:", error);
    return Response.json(
      { error: "Failed to set featured trip" },
      { status: 500 }
    );
  }
}
