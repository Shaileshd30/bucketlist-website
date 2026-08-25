import { promises as fs } from "fs";
import path from "path";

import type { Coupon } from "@/app/data/coupons";

export const dynamic = "force-dynamic";

const filePath = path.join(
  process.cwd(),
  "app",
  "data",
  "coupons.json"
);

export async function GET() {
  try {
    const data = await fs.readFile(filePath, "utf-8");

    const coupons = JSON.parse(data);

    return Response.json(coupons, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("GET /api/coupons failed:", error);

    return Response.json(
      {
        error: "Unable to load coupons.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Coupon[];

    if (!Array.isArray(body)) {
      return Response.json(
        {
          error: "Coupon data must be an array.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedCoupons = body.map((coupon) => ({
      ...coupon,
      code: coupon.code.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    }));

    await fs.writeFile(
      filePath,
      JSON.stringify(normalizedCoupons, null, 2),
      "utf-8"
    );

    return Response.json(
      {
        ok: true,
        couponsSaved: normalizedCoupons.length,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("PUT /api/coupons failed:", error);

    return Response.json(
      {
        error: "Unable to save coupons.",
      },
      {
        status: 500,
      }
    );
  }
}