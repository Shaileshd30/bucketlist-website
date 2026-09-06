import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME =
  "bla_admin_session";

export const ADMIN_SESSION_MAX_AGE_SECONDS =
  60 * 60 * 8;

export function createAdminSessionToken(
  username: string,
  secret: string,
  expiresAtMs: number
) {
  const signature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        `bucketlist-admin-session:${username}:${expiresAtMs}`
      )
      .digest("hex");

  return `${expiresAtMs}.${signature}`;
}

function safeCompare(
  expected: string,
  received: string
) {
  const expectedBuffer =
    Buffer.from(
      expected,
      "utf8"
    );

  const receivedBuffer =
    Buffer.from(
      received,
      "utf8"
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

export async function isAdminAuthenticated() {
  const adminUsername =
    process.env.ADMIN_USERNAME;

  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  if (
    !adminUsername ||
    !sessionSecret
  ) {
    return false;
  }

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE_NAME
    )?.value;

  if (!token) {
    return false;
  }

  const parts =
    token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const expiresAtText =
    parts[0];

  if (
    !/^[0-9]+$/.test(
      expiresAtText
    )
  ) {
    return false;
  }

  const expiresAtMs =
    Number(
      expiresAtText
    );

  if (
    !Number.isSafeInteger(
      expiresAtMs
    ) ||
    expiresAtMs <=
      Date.now()
  ) {
    return false;
  }

  const expectedToken =
    createAdminSessionToken(
      adminUsername,
      sessionSecret,
      expiresAtMs
    );

  return safeCompare(
    expectedToken,
    token
  );
}

export async function requireAdmin() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    return Response.json(
      {
        error:
          "Admin authentication required.",
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

  return null;
}