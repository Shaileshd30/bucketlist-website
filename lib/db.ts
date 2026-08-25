import { sql } from "@vercel/postgres";
import type { TripData } from "@/app/data/trips";

export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        summary TEXT NOT NULL,
        cta TEXT NOT NULL,

        price TEXT,
        duration TEXT,
        seats TEXT,

        durationDays INTEGER,

        difficulty TEXT NOT NULL,
        startPoint TEXT NOT NULL,
        groupSize TEXT,
        description TEXT,
        overview TEXT,
        category TEXT NOT NULL,
        image TEXT NOT NULL,

        gallery TEXT,
        itinerary TEXT,
        includes TEXT,
        notIncludes TEXT,
        pickupPoints TEXT,
        thingsToCarry TEXT,
        medicalDisclaimer TEXT,
        rules TEXT,

        batches TEXT,

        tripType TEXT,
        highlight TEXT,
        upcoming BOOLEAN DEFAULT FALSE,
        featured BOOLEAN DEFAULT FALSE,

        departureDate TEXT,
        departureLabel TEXT,

        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    /*
     * Existing databases may already have the trips table.
     * Add new columns safely if they do not exist.
     */
    await sql`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS durationDays INTEGER;
    `;

    await sql`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS batches TEXT;
    `;

    await sql`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS tripType TEXT;
    `;

    await sql`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS highlight TEXT;
    `;

    await sql`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS upcoming BOOLEAN DEFAULT FALSE;
    `;

    await sql`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS departureDate TEXT;
    `;

    await sql`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS departureLabel TEXT;
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

function mapTripRow(row: any): TripData {
  return {
    ...row,

    gallery: row.gallery ? JSON.parse(row.gallery) : [],

    itinerary: row.itinerary
      ? JSON.parse(row.itinerary)
      : [],

    includes: row.includes
      ? JSON.parse(row.includes)
      : [],

    notIncludes: row.notincludes
      ? JSON.parse(row.notincludes)
      : row.notIncludes
      ? JSON.parse(row.notIncludes)
      : [],

    pickupPoints: row.pickuppoints
      ? JSON.parse(row.pickuppoints)
      : row.pickupPoints
      ? JSON.parse(row.pickupPoints)
      : [],

    thingsToCarry: row.thingstocarry
      ? JSON.parse(row.thingstocarry)
      : row.thingsToCarry
      ? JSON.parse(row.thingsToCarry)
      : [],

    medicalDisclaimer: row.medicaldisclaimer
      ? JSON.parse(row.medicaldisclaimer)
      : row.medicalDisclaimer
      ? JSON.parse(row.medicalDisclaimer)
      : [],

    rules: row.rules
      ? JSON.parse(row.rules)
      : [],

    batches: row.batches
      ? JSON.parse(row.batches)
      : [],
  };
}

export async function getTrips(): Promise<TripData[]> {
  try {
    const result = await sql`
      SELECT *
      FROM trips
      ORDER BY createdAt ASC;
    `;

    return result.rows.map(mapTripRow);
  } catch (error) {
    console.error("Failed to fetch trips:", error);
    return [];
  }
}

export async function getTripBySlug(
  slug: string
): Promise<TripData | null> {
  try {
    const result = await sql`
      SELECT *
      FROM trips
      WHERE slug = ${slug};
    `;

    if (!result.rows[0]) {
      return null;
    }

    return mapTripRow(result.rows[0]);
  } catch (error) {
    console.error("Failed to fetch trip:", error);
    return null;
  }
}

export async function saveTrip(
  trip: TripData
): Promise<boolean> {
  try {
    await sql`
      INSERT INTO trips (
        id,
        slug,
        title,
        subtitle,
        summary,
        cta,

        price,
        duration,
        seats,
        durationDays,

        difficulty,
        startPoint,
        groupSize,
        description,
        overview,
        category,
        image,

        gallery,
        itinerary,
        includes,
        notIncludes,
        pickupPoints,
        thingsToCarry,
        medicalDisclaimer,
        rules,

        batches,

        tripType,
        highlight,
        upcoming,
        featured,

        departureDate,
        departureLabel
      )
      VALUES (
        ${trip.id},
        ${trip.slug},
        ${trip.title},
        ${trip.subtitle},
        ${trip.summary},
        ${trip.cta},

        ${trip.price || null},
        ${trip.duration || null},
        ${trip.seats || null},
        ${trip.durationDays || null},

        ${trip.difficulty},
        ${trip.startPoint},
        ${trip.groupSize || null},
        ${trip.description || null},
        ${trip.overview || null},
        ${trip.category},
        ${trip.image},

        ${JSON.stringify(trip.gallery || [])},
        ${JSON.stringify(trip.itinerary || [])},
        ${JSON.stringify(trip.includes || [])},
        ${JSON.stringify(trip.notIncludes || [])},
        ${JSON.stringify(trip.pickupPoints || [])},
        ${JSON.stringify(trip.thingsToCarry || [])},
        ${JSON.stringify(trip.medicalDisclaimer || [])},
        ${JSON.stringify(trip.rules || [])},

        ${JSON.stringify(trip.batches || [])},

        ${trip.tripType || null},
        ${trip.highlight || null},
        ${trip.upcoming || false},
        ${trip.featured || false},

        ${trip.departureDate || null},
        ${trip.departureLabel || null}
      )

      ON CONFLICT (id)
      DO UPDATE SET

        slug = ${trip.slug},
        title = ${trip.title},
        subtitle = ${trip.subtitle},
        summary = ${trip.summary},
        cta = ${trip.cta},

        price = ${trip.price || null},
        duration = ${trip.duration || null},
        seats = ${trip.seats || null},
        durationDays = ${trip.durationDays || null},

        difficulty = ${trip.difficulty},
        startPoint = ${trip.startPoint},
        groupSize = ${trip.groupSize || null},
        description = ${trip.description || null},
        overview = ${trip.overview || null},
        category = ${trip.category},
        image = ${trip.image},

        gallery = ${JSON.stringify(trip.gallery || [])},
        itinerary = ${JSON.stringify(trip.itinerary || [])},
        includes = ${JSON.stringify(trip.includes || [])},
        notIncludes = ${JSON.stringify(trip.notIncludes || [])},
        pickupPoints = ${JSON.stringify(trip.pickupPoints || [])},
        thingsToCarry = ${JSON.stringify(trip.thingsToCarry || [])},
        medicalDisclaimer = ${JSON.stringify(
          trip.medicalDisclaimer || []
        )},
        rules = ${JSON.stringify(trip.rules || [])},

        batches = ${JSON.stringify(trip.batches || [])},

        tripType = ${trip.tripType || null},
        highlight = ${trip.highlight || null},
        upcoming = ${trip.upcoming || false},
        featured = ${trip.featured || false},

        departureDate = ${trip.departureDate || null},
        departureLabel = ${trip.departureLabel || null},

        updatedAt = CURRENT_TIMESTAMP;
    `;

    return true;
  } catch (error) {
    console.error("Failed to save trip:", error);
    return false;
  }
}

export async function deleteTrip(
  slug: string
): Promise<boolean> {
  try {
    await sql`
      DELETE FROM trips
      WHERE slug = ${slug};
    `;

    return true;
  } catch (error) {
    console.error("Failed to delete trip:", error);
    return false;
  }
}

export async function setFeatured(
  slug: string
): Promise<boolean> {
  try {
    await sql`
      UPDATE trips
      SET featured = FALSE;
    `;

    await sql`
      UPDATE trips
      SET featured = TRUE
      WHERE slug = ${slug};
    `;

    return true;
  } catch (error) {
    console.error("Failed to set featured trip:", error);
    return false;
  }
}