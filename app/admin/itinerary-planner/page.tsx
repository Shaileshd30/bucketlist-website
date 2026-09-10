import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import ItineraryPlanner from "@/app/components/ItineraryPlanner";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Itinerary Planner", robots: { index: false, follow: false } };
export default async function Page() {
  if (await requireAdmin()) redirect("/admin");
  return <ItineraryPlanner admin />;
}
