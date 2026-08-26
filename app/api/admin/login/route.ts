import crypto from "crypto";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type LoginRequest = {
  username?: string;
  password?: string;
};

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

    const body =
      (await request.json()) as LoginRequest;

    const username =
      body.username?.trim() || "";

    const password =
      body.password || "";

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
      return Response.json(
        {
          error:
            "Incorrect username or password.",
        },
        {
          status: 401,
        }
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

    return Response.json({
      ok: true,
    });
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