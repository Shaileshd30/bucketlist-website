"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  Coupon,
  CouponScope,
  CouponStatus,
  DiscountType,
} from "@/app/data/coupons";

import type { TripData } from "@/app/data/trips";

type CouponManagerProps = {
  trips: TripData[];
};

const emptyCoupon = (): Coupon => ({
  id: `coupon-${Date.now()}`,
  code: "",
  description: "",
  discountType: "FIXED_AMOUNT",
  discountValue: 0,
  minimumBookingAmount: 0,
  maximumDiscount: 0,
  validFrom: "",
  validUntil: "",
  usageLimit: 1,
  usedCount: 0,
  status: "ACTIVE",
  scope: "ALL_TRIPS",
  allowedTripSlugs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function CouponManager({
  trips,
}: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/coupons", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load coupons");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setCoupons(data);

          if (data.length > 0) {
            setSelectedCouponId(data[0].id);
          }
        }
      } catch {
        setMessage({
          type: "error",
          text: "Could not load coupons.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const selectedCoupon = useMemo(() => {
    return (
      coupons.find(
        (coupon) => coupon.id === selectedCouponId
      ) || null
    );
  }, [coupons, selectedCouponId]);

  const updateCoupon = <
    K extends keyof Coupon
  >(
    field: K,
    value: Coupon[K]
  ) => {
    if (!selectedCoupon) {
      return;
    }

    setMessage(null);

    setCoupons((current) =>
      current.map((coupon) =>
        coupon.id === selectedCoupon.id
          ? {
              ...coupon,
              [field]: value,
              updatedAt: new Date().toISOString(),
            }
          : coupon
      )
    );
  };

  const addCoupon = () => {
    const newCoupon = emptyCoupon();

    setCoupons((current) => [
      ...current,
      newCoupon,
    ]);

    setSelectedCouponId(newCoupon.id);

    setMessage({
      type: "success",
      text: "New coupon created. Complete the details and save.",
    });
  };

  const deleteCoupon = () => {
    if (!selectedCoupon) {
      return;
    }

    const confirmed = window.confirm(
      `Delete coupon "${selectedCoupon.code || "Untitled"}"?`
    );

    if (!confirmed) {
      return;
    }

    const remaining = coupons.filter(
      (coupon) => coupon.id !== selectedCoupon.id
    );

    setCoupons(remaining);

    setSelectedCouponId(
      remaining[0]?.id || ""
    );

    setMessage({
      type: "success",
      text: "Coupon removed. Save changes to persist it.",
    });
  };

  const saveCoupons = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const cleanedCoupons = coupons.map(
        (coupon) => ({
          ...coupon,

          code: coupon.code
            .trim()
            .toUpperCase(),

          discountValue:
            Number(coupon.discountValue) || 0,

          minimumBookingAmount:
            coupon.minimumBookingAmount
              ? Number(
                  coupon.minimumBookingAmount
                )
              : undefined,

          maximumDiscount:
            coupon.maximumDiscount
              ? Number(
                  coupon.maximumDiscount
                )
              : undefined,

          usageLimit:
            coupon.usageLimit
              ? Number(coupon.usageLimit)
              : undefined,

          usedCount:
            Number(coupon.usedCount) || 0,

          allowedTripSlugs:
            coupon.scope ===
            "SELECTED_TRIPS"
              ? coupon.allowedTripSlugs || []
              : [],
        })
      );

      const response = await fetch(
        "/api/coupons",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            cleanedCoupons
          ),

          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to save coupons"
        );
      }

      const refreshed = await fetch(
        "/api/coupons",
        {
          cache: "no-store",
        }
      );

      if (refreshed.ok) {
        const data =
          await refreshed.json();

        if (Array.isArray(data)) {
          setCoupons(data);
        }
      }

      setMessage({
        type: "success",
        text: "Coupons saved successfully.",
      });
    } catch {
      setMessage({
        type: "error",
        text: "Coupons could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleTrip = (
    slug: string
  ) => {
    if (!selectedCoupon) {
      return;
    }

    const existing =
      selectedCoupon.allowedTripSlugs ||
      [];

    const next = existing.includes(slug)
      ? existing.filter(
          (item) => item !== slug
        )
      : [...existing, slug];

    updateCoupon(
      "allowedTripSlugs",
      next
    );
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white p-8">
        <p className="text-sm font-medium text-[#5d6862]">
          Loading coupons...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)] lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-500">
              Coupons & Discounts
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Manage discount codes
            </h2>

            <p className="mt-2 text-sm text-[#5d6862]">
              Create private client codes,
              promotional discounts and
              trip-specific offers.
            </p>
          </div>

          <button
            type="button"
            onClick={addCoupon}
            className="inline-flex items-center justify-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
          >
            + Add coupon
          </button>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-8 text-center">
          <p className="font-semibold">
            No coupons yet
          </p>

          <p className="mt-2 text-sm text-[#5d6862]">
            Create your first discount
            code.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
          <div className="rounded-[28px] border border-black/10 bg-white p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.26em] text-[#17251d]/60">
              Coupon list
            </p>

            <div className="space-y-2">
              {coupons.map((coupon) => {
                const selected =
                  coupon.id ===
                  selectedCouponId;

                return (
                  <button
                    key={coupon.id}
                    type="button"
                    onClick={() =>
                      setSelectedCouponId(
                        coupon.id
                      )
                    }
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-orange-400 bg-orange-50"
                        : "border-black/10 bg-[#f7f5f2] hover:border-orange-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">
                        {coupon.code ||
                          "Untitled coupon"}
                      </p>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          coupon.status ===
                          "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {coupon.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[#5d6862]">
                      {coupon.discountType ===
                      "PERCENTAGE"
                        ? `${coupon.discountValue}% off`
                        : `₹${coupon.discountValue.toLocaleString(
                            "en-IN"
                          )} off`}
                    </p>

                    {coupon.usageLimit && (
                      <p className="mt-1 text-xs text-[#5d6862]">
                        Used{" "}
                        {coupon.usedCount}/
                        {coupon.usageLimit}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedCoupon && (
            <div className="rounded-[28px] border border-black/10 bg-white p-6 lg:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <span>Coupon code</span>

                  <input
                    value={
                      selectedCoupon.code
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "code",
                        event.target.value.toUpperCase()
                      )
                    }
                    placeholder="VIP2000"
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 font-semibold uppercase tracking-[0.08em] outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>Status</span>

                  <select
                    value={
                      selectedCoupon.status
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "status",
                        event.target
                          .value as CouponStatus
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>
                    Discount type
                  </span>

                  <select
                    value={
                      selectedCoupon.discountType
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "discountType",
                        event.target
                          .value as DiscountType
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  >
                    <option value="FIXED_AMOUNT">
                      Fixed ₹ amount
                    </option>

                    <option value="PERCENTAGE">
                      Percentage
                    </option>
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>
                    {selectedCoupon.discountType ===
                    "PERCENTAGE"
                      ? "Discount %"
                      : "Discount amount ₹"}
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      selectedCoupon.discountValue
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "discountValue",
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>
                    Minimum booking ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      selectedCoupon.minimumBookingAmount ||
                      ""
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "minimumBookingAmount",
                        Number(
                          event.target
                            .value
                        ) || undefined
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>
                    Maximum discount ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    disabled={
                      selectedCoupon.discountType !==
                      "PERCENTAGE"
                    }
                    value={
                      selectedCoupon.maximumDiscount ||
                      ""
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "maximumDiscount",
                        Number(
                          event.target
                            .value
                        ) || undefined
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400 disabled:opacity-50"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>Valid from</span>

                  <input
                    type="date"
                    value={
                      selectedCoupon.validFrom ||
                      ""
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "validFrom",
                        event.target.value ||
                          undefined
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>Valid until</span>

                  <input
                    type="date"
                    value={
                      selectedCoupon.validUntil ||
                      ""
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "validUntil",
                        event.target.value ||
                          undefined
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>Usage limit</span>

                  <input
                    type="number"
                    min="1"
                    value={
                      selectedCoupon.usageLimit ||
                      ""
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "usageLimit",
                        Number(
                          event.target
                            .value
                        ) || undefined
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <div className="space-y-2 text-sm font-medium">
                  <span>Used count</span>

                  <div className="flex h-[50px] items-center rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 font-semibold">
                    {selectedCoupon.usedCount}
                  </div>
                </div>

                <label className="space-y-2 text-sm font-medium md:col-span-2">
                  <span>Description</span>

                  <textarea
                    rows={3}
                    value={
                      selectedCoupon.description ||
                      ""
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Private client discount, promotional offer, early bird, etc."
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium md:col-span-2">
                  <span>
                    Applicable trips
                  </span>

                  <select
                    value={
                      selectedCoupon.scope
                    }
                    onChange={(event) =>
                      updateCoupon(
                        "scope",
                        event.target
                          .value as CouponScope
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 py-3 outline-none transition focus:border-orange-400"
                  >
                    <option value="ALL_TRIPS">
                      All trips
                    </option>

                    <option value="SELECTED_TRIPS">
                      Selected trips only
                    </option>
                  </select>
                </label>
              </div>

              {selectedCoupon.scope ===
                "SELECTED_TRIPS" && (
                <div className="mt-5 rounded-[24px] border border-black/10 bg-[#f7f5f2] p-5">
                  <p className="mb-4 text-sm font-bold">
                    Select trips
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {trips.map((trip) => {
                      const checked =
                        (
                          selectedCoupon.allowedTripSlugs ||
                          []
                        ).includes(
                          trip.slug
                        );

                      return (
                        <label
                          key={
                            trip.slug
                          }
                          className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={() =>
                              toggleTrip(
                                trip.slug
                              )
                            }
                            className="h-5 w-5 accent-orange-500"
                          />

                          <span>
                            {trip.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={saveCoupons}
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#17251d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save coupons"}
                </button>

                <button
                  type="button"
                  onClick={deleteCoupon}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  Delete coupon
                </button>
              </div>

              {message && (
                <p
                  className={`mt-4 text-sm font-medium ${
                    message.type ===
                    "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message.text}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}