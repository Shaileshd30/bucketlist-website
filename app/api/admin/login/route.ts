import crypto from "crypto";
import { cookies } from "next/headers";

import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type LoginRequest = {
  username?: string;
  password?: string;
};

type LoginAttemptRow = {
  client_key: string;
  failed_attempts: number;
  window_started_at: string;
  blocked_until: string | null;
  updated_at: string;
};

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 15;

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    aBuffer,
    bBuffer
  );
}

function createSessionToken(
  username: string,
  secret: string
) {
  return crypto
    .createHmac("sha256", secret)
    .update(
      `bucketlist-admin-session:${username}`
    )
    .digest("hex");
}

function getClientIdentifier(
  request: Request,
  username: string
) {
  const cfConnectingIp =
    request.headers
      .get("cf-connecting-ip")
      ?.trim();

  const realIp =
    request.headers
      .get("x-real-ip")
      ?.trim();

  const forwardedFor =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean);

  const forwardedIp =
    forwardedFor &&
    forwardedFor.length > 0
      ? forwardedFor[
          forwardedFor.length - 1
        ]
      : undefined;

  const ip =
    cfConnectingIp ||
    realIp ||
    forwardedIp ||
    "unknown";

  return `${ip}:${username.toLowerCase()}`;
}

function createClientKey(
  identifier: string,
  secret: string
) {
  return crypto
    .createHmac("sha256", secret)
    .update(
      `bucketlist-admin-rate-limit:${identifier}`
    )
    .digest("hex");
}

function minutesFromNow(
  minutes: number
) {
  return new Date(
    Date.now() +
      minutes * 60 * 1000
  );
}

function secondsUntil(
  date: Date
) {
  return Math.max(
    1,
    Math.ceil(
      (
        date.getTime() -
        Date.now()
      ) / 1000
    )
  );
}

async function loadLoginAttempt(
  clientKey: string
) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("admin_login_attempts")
    .select(
      `
        client_key,
        failed_attempts,
        window_started_at,
        blocked_until,
        updated_at
      `
    )
    .eq(
      "client_key",
      clientKey
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    data as LoginAttemptRow | null
  );
}

async function clearLoginAttempt(
  clientKey: string
) {
  const {
    error,
  } = await supabaseAdmin
    .from("admin_login_attempts")
    .delete()
    .eq(
      "client_key",
      clientKey
    );

  if (error) {
    throw error;
  }
}

async function recordFailedAttempt(
  clientKey: string,
  current:
    | LoginAttemptRow
    | null
) {
  const now =
    new Date();

  const windowStart =
    current
      ? new Date(
          current.window_started_at
        )
      : now;

  const windowAgeMs =
    now.getTime() -
    windowStart.getTime();

  const windowExpired =
    !Number.isFinite(
      windowAgeMs
    ) ||
    windowAgeMs >
      WINDOW_MINUTES *
        60 *
        1000;

  const failedAttempts =
    windowExpired
      ? 1
      : (
          current?.failed_attempts ||
          0
        ) + 1;

  const nextWindowStart =
    windowExpired
      ? now
      : windowStart;

  const shouldBlock =
    failedAttempts >=
    MAX_FAILED_ATTEMPTS;

  const blockedUntil =
    shouldBlock
      ? minutesFromNow(
          BLOCK_MINUTES
        )
      : null;

  const {
    error,
  } = await supabaseAdmin
    .from("admin_login_attempts")
    .upsert(
      {
        client_key:
          clientKey,

        failed_attempts:
          failedAttempts,

        window_started_at:
          nextWindowStart.toISOString(),

        blocked_until:
          blockedUntil
            ? blockedUntil.toISOString()
            : null,

        updated_at:
          now.toISOString(),
      },
      {
        onConflict:
          "client_key",
      }
    );

  if (error) {
    throw error;
  }

  return {
    failedAttempts,
    blockedUntil,
  };
}

export async function POST(
  request: Request
) {
  try {
    const adminUsername =
      process.env.ADMIN_USERNAME;

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    const sessionSecret =
      process.env.ADMIN_SESSION_SECRET;

    if (
      !adminUsername ||
      !adminPassword ||
      !sessionSecret
    ) {
      console.error(
        "Admin authentication environment variables are missing."
      );

      return Response.json(
        {
          error:
            "Admin authentication is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    let body: LoginRequest;

try {
  const parsedBody: unknown =
    await request.json();

  if (
    parsedBody === null ||
    typeof parsedBody !== "object" ||
    Array.isArray(parsedBody)
  ) {
    return Response.json(
      {
        error:
          "Invalid JSON request body.",
      },
      {
        status: 400,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  body =
    parsedBody as LoginRequest;
} catch {
  return Response.json(
    {
      error:
        "Invalid JSON request body.",
    },
    {
      status: 400,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

const username =
  body.username?.trim() || "";

const password =
  body.password || "";

    const identifier =
      getClientIdentifier(
        request,
        username
      );

    const clientKey =
      createClientKey(
        identifier,
        sessionSecret
      );

    let loginAttempt:
      | LoginAttemptRow
      | null = null;

    try {
      loginAttempt =
        await loadLoginAttempt(
          clientKey
        );
    } catch (error) {
      console.error(
        "Unable to read admin login rate limit state:",
        error
      );
    }

    if (
      loginAttempt?.blocked_until
    ) {
      const blockedUntil =
        new Date(
          loginAttempt.blocked_until
        );

      if (
        Number.isFinite(
          blockedUntil.getTime()
        ) &&
        blockedUntil >
          new Date()
      ) {
        const retryAfter =
          secondsUntil(
            blockedUntil
          );

        return Response.json(
          {
            error:
              "Too many login attempts. Please try again later.",
          },
          {
            status: 429,

            headers: {
              "Retry-After":
                String(
                  retryAfter
                ),

              "Cache-Control":
                "no-store",
            },
          }
        );
      }
    }

    const usernameValid =
      safeCompare(
        username,
        adminUsername
      );

    const passwordValid =
      safeCompare(
        password,
        adminPassword
      );

    if (
      !usernameValid ||
      !passwordValid
    ) {
      try {
        const result =
          await recordFailedAttempt(
            clientKey,
            loginAttempt
          );

        if (
          result.blockedUntil
        ) {
          const retryAfter =
            secondsUntil(
              result.blockedUntil
            );

          return Response.json(
            {
              error:
                "Too many login attempts. Please try again later.",
            },
            {
              status: 429,

              headers: {
                "Retry-After":
                  String(
                    retryAfter
                  ),

                "Cache-Control":
                  "no-store",
              },
            }
          );
        }
      } catch (error) {
        console.error(
          "Unable to update admin login rate limit state:",
          error
        );
      }

      return Response.json(
        {
          error:
            "Incorrect username or password.",
        },
        {
          status: 401,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    try {
      await clearLoginAttempt(
        clientKey
      );
    } catch (error) {
      console.error(
        "Unable to clear admin login rate limit state:",
        error
      );
    }

    const sessionToken =
      createSessionToken(
        adminUsername,
        sessionSecret
      );

    const cookieStore =
      await cookies();

    cookieStore.set(
      "bla_admin_session",
      sessionToken,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "strict",

        path: "/",

        maxAge:
          60 * 60 * 8,
      }
    );

    return Response.json(
      {
        ok: true,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin login failed:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to log in.",
      },
      {
        status: 500,
      }
    );
  }
}
