import type { Metadata } from "next";
import ItineraryPlanner from "@/app/components/ItineraryPlanner";
export const metadata: Metadata = { title: "Custom Trip Itinerary Planner", description: "Personalise a Bucketlist Adventure itinerary and request a quote for your trek or holiday.", alternates: { canonical: "/trip-planner" } };
export default function Page() { return <ItineraryPlanner />; }
