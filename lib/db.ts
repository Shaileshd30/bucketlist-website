import { sql } from "@vercel/postgres";
import type { TripData } from "@/app/data/trips";

export async function initializeDatabase() {
  try {
    // Create trips table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        summary TEXT NOT NULL,
        cta TEXT NOT NULL,
        price TEXT NOT NULL,
        duration TEXT NOT NULL,
        seats TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        startPoint TEXT NOT NULL,
        groupSize TEXT NOT NULL,
        description TEXT NOT NULL,
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
        featured BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

export async function getTrips(): Promise<TripData[]> {
  try {
    const result = await sql`SELECT * FROM trips ORDER BY createdAt ASC;`;
    return result.rows.map((row: any) => ({
      ...row,
      gallery: row.gallery ? JSON.parse(row.gallery) : [],
      itinerary: row.itinerary ? JSON.parse(row.itinerary) : [],
      includes: row.includes ? JSON.parse(row.includes) : [],
      notIncludes: row.notIncludes ? JSON.parse(row.notIncludes) : [],
      pickupPoints: row.pickupPoints ? JSON.parse(row.pickupPoints) : [],
      thingsToCarry: row.thingsToCarry ? JSON.parse(row.thingsToCarry) : [],
      medicalDisclaimer: row.medicalDisclaimer ? JSON.parse(row.medicalDisclaimer) : [],
      rules: row.rules ? JSON.parse(row.rules) : [],
    })) as TripData[];
  } catch (error) {
    console.error("Failed to fetch trips:", error);
    return [];
  }
}

export async function getTripBySlug(slug: string): Promise<TripData | null> {
  try {
    const result = await sql`SELECT * FROM trips WHERE slug = ${slug};`;
    if (!result.rows[0]) return null;
    const row = result.rows[0] as any;
    return {
      ...row,
      gallery: row.gallery ? JSON.parse(row.gallery) : [],
      itinerary: row.itinerary ? JSON.parse(row.itinerary) : [],
      includes: row.includes ? JSON.parse(row.includes) : [],
      notIncludes: row.notIncludes ? JSON.parse(row.notIncludes) : [],
      pickupPoints: row.pickupPoints ? JSON.parse(row.pickupPoints) : [],
      thingsToCarry: row.thingsToCarry ? JSON.parse(row.thingsToCarry) : [],
      medicalDisclaimer: row.medicalDisclaimer ? JSON.parse(row.medicalDisclaimer) : [],
      rules: row.rules ? JSON.parse(row.rules) : [],
    };
  } catch (error) {
    console.error("Failed to fetch trip:", error);
    return null;
  }
}

export async function saveTrip(trip: TripData): Promise<boolean> {
  try {
    await sql`
      INSERT INTO trips (
        id, slug, title, subtitle, summary, cta, price, duration, seats,
        difficulty, startPoint, groupSize, description, overview, category,
        image, gallery, itinerary, includes, notIncludes, pickupPoints,
        thingsToCarry, medicalDisclaimer, rules, featured
      ) VALUES (
        ${trip.id}, ${trip.slug}, ${trip.title}, ${trip.subtitle},
        ${trip.summary}, ${trip.cta}, ${trip.price}, ${trip.duration},
        ${trip.seats}, ${trip.difficulty}, ${trip.startPoint},
        ${trip.groupSize}, ${trip.description}, ${trip.overview || null},
        ${trip.category}, ${trip.image}, ${JSON.stringify(trip.gallery || [])},
        ${JSON.stringify(trip.itinerary)}, ${JSON.stringify(trip.includes)}, 
        ${JSON.stringify(trip.notIncludes)},
        ${JSON.stringify(trip.pickupPoints || [])}, 
        ${JSON.stringify(trip.thingsToCarry || [])},
        ${JSON.stringify(trip.medicalDisclaimer || [])}, 
        ${JSON.stringify(trip.rules || [])},
        ${trip.featured || false}
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = ${trip.slug}, title = ${trip.title}, subtitle = ${trip.subtitle},
        summary = ${trip.summary}, cta = ${trip.cta}, price = ${trip.price},
        duration = ${trip.duration}, seats = ${trip.seats},
        difficulty = ${trip.difficulty}, startPoint = ${trip.startPoint},
        groupSize = ${trip.groupSize}, description = ${trip.description},
        overview = ${trip.overview || null}, category = ${trip.category},
        image = ${trip.image}, gallery = ${JSON.stringify(trip.gallery || [])},
        itinerary = ${JSON.stringify(trip.itinerary)}, 
        includes = ${JSON.stringify(trip.includes)},
        notIncludes = ${JSON.stringify(trip.notIncludes)}, 
        pickupPoints = ${JSON.stringify(trip.pickupPoints || [])},
        thingsToCarry = ${JSON.stringify(trip.thingsToCarry || [])},
        medicalDisclaimer = ${JSON.stringify(trip.medicalDisclaimer || [])},
        rules = ${JSON.stringify(trip.rules || [])}, 
        featured = ${trip.featured || false},
        updatedAt = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (error) {
    console.error("Failed to save trip:", error);
    return false;
  }
}

export async function deleteTrip(slug: string): Promise<boolean> {
  try {
    await sql`DELETE FROM trips WHERE slug = ${slug};`;
    return true;
  } catch (error) {
    console.error("Failed to delete trip:", error);
    return false;
  }
}

export async function setFeatured(slug: string): Promise<boolean> {
  try {
    // Clear previous featured
    await sql`UPDATE trips SET featured = FALSE;`;
    // Set new featured
    await sql`UPDATE trips SET featured = TRUE WHERE slug = ${slug};`;
    return true;
  } catch (error) {
    console.error("Failed to set featured trip:", error);
    return false;
  }
}
