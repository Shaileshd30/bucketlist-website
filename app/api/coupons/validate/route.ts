import { promises as fs } from "fs";
import path from "path";

import type { Coupon } from "@/app/data/coupons";

type ValidateCouponRequest = {
  code?: string;
  tripSlug?: string;
  bookingAmount?: number;
};

type CouponValidationResult = {
  valid: boolean;
  code?: string;
  message: string;
  discountAmount: number;
  finalAmount: number;
};

const filePath = path.join(
  process.cwd(),
  "app",
  "data",
  "coupons.json"
);

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function calculateDiscount(
  coupon: Coupon,
  bookingAmount: number
) {
  if (coupon.discountType === "FIXED_AMOUNT") {
    return Math.min(coupon.discountValue, bookingAmount);
  }

  const percentageDiscount =
    (bookingAmount * coupon.discountValue) / 100;

  if (
    coupon.maximumDiscount &&
    coupon.maximumDiscount > 0
  ) {
    return Math.min(
      percentageDiscount,
      coupon.maximumDiscount
    );
  }

  return percentageDiscount;
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as ValidateCouponRequest;

    const code = normalizeCode(body.code || "");
    const tripSlug = body.tripSlug || "";
    const bookingAmount = Number(
      body.bookingAmount || 0
    );

    if (!code) {
      return Response.json(
        {
          valid: false,
          message: "Please enter a coupon code.",
          discountAmount: 0,
          finalAmount: bookingAmount,
        } satisfies CouponValidationResult,
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(bookingAmount) ||
      bookingAmount <= 0
    ) {
      return Response.json(
        {
          valid: false,
          message: "Invalid booking amount.",
          discountAmount: 0,
          finalAmount: 0,
        } satisfies CouponValidationResult,
        { status: 400 }
      );
    }

    const raw = await fs.readFile(filePath, "utf-8");
    const coupons = JSON.parse(raw) as Coupon[];

    const coupon = coupons.find(
      (item) => normalizeCode(item.code) === code
    );

    if (!coupon) {
      return Response.json({
        valid: false,
        message: "Coupon code is not valid.",
        discountAmount: 0,
        finalAmount: bookingAmount,
      } satisfies CouponValidationResult);
    }

    if (coupon.status !== "ACTIVE") {
      return Response.json({
        valid: false,
        message: "This coupon is currently inactive.",
        discountAmount: 0,
        finalAmount: bookingAmount,
      } satisfies CouponValidationResult);
    }

    const now = new Date();

    if (coupon.validFrom) {
      const validFrom = new Date(
        `${coupon.validFrom}T00:00:00`
      );

      if (now < validFrom) {
        return Response.json({
          valid: false,
          message: "This coupon is not active yet.",
          discountAmount: 0,
          finalAmount: bookingAmount,
        } satisfies CouponValidationResult);
      }
    }

    if (coupon.validUntil) {
      const validUntil = new Date(
        `${coupon.validUntil}T23:59:59`
      );

      if (now > validUntil) {
        return Response.json({
          valid: false,
          message: "This coupon has expired.",
          discountAmount: 0,
          finalAmount: bookingAmount,
        } satisfies CouponValidationResult);
      }
    }

    if (
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return Response.json({
        valid: false,
        message:
          "This coupon has reached its usage limit.",
        discountAmount: 0,
        finalAmount: bookingAmount,
      } satisfies CouponValidationResult);
    }

    if (
      coupon.minimumBookingAmount &&
      bookingAmount < coupon.minimumBookingAmount
    ) {
      return Response.json({
        valid: false,
        message: `Minimum booking amount for this coupon is ₹${coupon.minimumBookingAmount.toLocaleString(
          "en-IN"
        )}.`,
        discountAmount: 0,
        finalAmount: bookingAmount,
      } satisfies CouponValidationResult);
    }

    if (coupon.scope === "SELECTED_TRIPS") {
      const allowedTrips =
        coupon.allowedTripSlugs || [];

      if (!allowedTrips.includes(tripSlug)) {
        return Response.json({
          valid: false,
          message:
            "This coupon is not valid for the selected trip.",
          discountAmount: 0,
          finalAmount: bookingAmount,
        } satisfies CouponValidationResult);
      }
    }

    const discountAmount = Math.round(
      calculateDiscount(coupon, bookingAmount)
    );

    const finalAmount = Math.max(
      0,
      bookingAmount - discountAmount
    );

    return Response.json({
      valid: true,
      code: coupon.code,
      message: `Coupon ${coupon.code} applied successfully.`,
      discountAmount,
      finalAmount,
    } satisfies CouponValidationResult);
  } catch (error) {
    console.error(
      "Coupon validation failed:",
      error
    );

    return Response.json(
      {
        valid: false,
        message:
          "Unable to validate the coupon right now.",
        discountAmount: 0,
        finalAmount: 0,
      } satisfies CouponValidationResult,
      {
        status: 500,
      }
    );
  }
}