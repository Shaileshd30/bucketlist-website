import type { MetadataRoute } from "next";

import { supabaseAdmin } from "@/lib/supabase-server";
import { defaultTrips } from "./data/trips";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://bucketlistadventure.in";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/trips`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/treks-near-pune`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cancellation-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  let slugs: string[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from("trips")
      .select("slug")
      .not("slug", "is", null);

    if (error) {
      console.error("Sitemap trip lookup failed:", error);
    } else if (Array.isArray(data)) {
      slugs = data
        .map((item) => String(item.slug || "").trim())
        .filter(Boolean);
    }
  } catch (error) {
    console.error("Sitemap generation failed:", error);
  }

  /*
   * Fallback to defaultTrips if Supabase is temporarily unavailable.
   */
  if (slugs.length === 0) {
    slugs = defaultTrips
      .map((trip) => trip.slug)
      .filter(Boolean);
  }

  /*
   * Remove duplicate slugs before generating URLs.
   */
  const uniqueSlugs = Array.from(new Set(slugs));

  const tripPages: MetadataRoute.Sitemap = uniqueSlugs.map((slug) => ({
    url: `${baseUrl}/trips/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...tripPages];
}