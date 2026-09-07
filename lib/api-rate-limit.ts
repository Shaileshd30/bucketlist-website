import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase-server";

type RateLimitRow = {
  is_allowed: boolean;
  retry_after_seconds: number;
};

type ApiRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function getClientIp(
  request: Request
): string {
  const cloudflareIp =
    request.headers
      .get("cf-connecting-ip")
      ?.trim();

  const realIp =
    request.headers
      .get("x-real-ip")
      ?.trim();

  const forwardedIp =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

  return (
    cloudflareIp ||
    realIp ||
    forwardedIp ||
    "unknown"
  );
}

export async function consumeApiRateLimit(
  request: Request,
  scope: string,
  maximumRequests: number,
  windowSeconds: number
): Promise<ApiRateLimitResult> {
  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "API rate-limit secret is not configured."
    );
  }

  const clientIp =
    getClientIp(request);

  const rateKey = crypto
    .createHmac("sha256", secret)
    .update(
      `bucketlist-api-rate-limit:${scope}:${clientIp}`
    )
    .digest("hex");

  const {
    data,
    error,
  } = await supabaseAdmin.rpc(
    "consume_api_rate_limit",
    {
      p_rate_key: rateKey,
      p_max_requests:
        maximumRequests,
      p_window_seconds:
        windowSeconds,
    }
  );

  if (error) {
    throw error;
  }

  const row =
    (
      Array.isArray(data)
        ? data[0]
        : data
    ) as RateLimitRow | null;

  if (
    !row ||
    typeof row.is_allowed !==
      "boolean" ||
    !Number.isFinite(
      Number(
        row.retry_after_seconds
      )
    )
  ) {
    throw new Error(
      "Invalid API rate-limit response."
    );
  }

  return {
    allowed: row.is_allowed,
    retryAfterSeconds:
      Math.max(
        0,
        Number(
          row.retry_after_seconds
        )
      ),
  };
}