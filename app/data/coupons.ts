export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type CouponScope = "ALL_TRIPS" | "SELECTED_TRIPS";

export type CouponStatus = "ACTIVE" | "INACTIVE";

export type Coupon = {
  id: string;

  code: string;

  description?: string;

  discountType: DiscountType;

  discountValue: number;

  minimumBookingAmount?: number;

  maximumDiscount?: number;

  validFrom?: string;

  validUntil?: string;

  usageLimit?: number;

  usedCount: number;

  status: CouponStatus;

  scope: CouponScope;

  allowedTripSlugs?: string[];

  createdAt: string;

  updatedAt: string;
};

export const defaultCoupons: Coupon[] = [
  {
    id: "welcome10",
    code: "WELCOME10",
    description: "10% promotional discount.",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minimumBookingAmount: 1000,
    maximumDiscount: 1500,
    usageLimit: 50,
    usedCount: 0,
    status: "ACTIVE",
    scope: "ALL_TRIPS",
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
  },

  {
    id: "leh2000",
    code: "LEH2000",
    description: "₹2,000 off on Leh Ladakh Expedition.",
    discountType: "FIXED_AMOUNT",
    discountValue: 2000,
    minimumBookingAmount: 10000,
    usageLimit: 10,
    usedCount: 0,
    status: "ACTIVE",
    scope: "SELECTED_TRIPS",
    allowedTripSlugs: ["leh-ladakh"],
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
  },
];

export function getDefaultCoupons(): Coupon[] {
  return defaultCoupons;
}