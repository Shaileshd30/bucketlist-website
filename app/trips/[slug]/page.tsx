import type { Metadata } from "next";
import { promises as fs } from "fs";
import path from "path";
import { defaultTrips, type TripData } from "../../data/trips";
import { TripPageClient } from "./TripPageClient";

export const dynamic = "force-dynamic";

const filePath = path.join(process.cwd(), "app", "data", "trips.json");

async function getPublicTrips(): Promise<TripData[]> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const trips = JSON.parse(data);

    return Array.isArray(trips) && trips.length > 0
      ? trips
      : defaultTrips;
  } catch {
    return defaultTrips;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);

  const trips = await getPublicTrips();

  const trip =
    trips.find((item) => item.slug === slug) ??
    defaultTrips[0];

  return {
    title: `${trip.title} | Bucketlist Adventure`,
    description: trip.summary,

    alternates: {
      canonical: `/trips/${trip.slug}`,
    },

    openGraph: {
      title: trip.title,
      description: trip.summary,
      url: `/trips/${trip.slug}`,
      images: [
        {
          url: trip.image,
          alt: trip.title,
        },
      ],
      type: "article",
    },
  };
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);

  const trips = await getPublicTrips();

  const trip = trips.find((item) => item.slug === slug);

  if (!trip) {
    return <TripPageClient trip={defaultTrips[0]} />;
  }

  return <TripPageClient trip={trip} />;
}