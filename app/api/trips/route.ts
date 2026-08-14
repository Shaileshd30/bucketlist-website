import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const filePath = path.join(process.cwd(), "app", "data", "trips.json");

export async function GET() {
  const data = await fs.readFile(filePath, "utf-8");
  return Response.json(JSON.parse(data), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  console.log("PUT /api/trips called");
console.log("Writing to:", filePath);
console.log("Number of trips:", Array.isArray(body) ? body.length : "NOT AN ARRAY");
  await fs.writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");
  return Response.json({ ok: true }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
