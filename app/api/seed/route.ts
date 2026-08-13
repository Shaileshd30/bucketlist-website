import { getTrips, saveTrip } from "@/lib/db";
import { defaultTrips } from "@/app/data/trips";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Check if database has trips
    const existing = await getTrips();

    if (existing && existing.length > 0) {
      return Response.json(
        { message: "Database already seeded" },
        { status: 200 }
      );
    }

    // Seed with default trips
    for (const trip of defaultTrips) {
      await saveTrip(trip);
    }

    return Response.json(
      { message: "Database seeded successfully", count: defaultTrips.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to seed database:", error);
    return Response.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
