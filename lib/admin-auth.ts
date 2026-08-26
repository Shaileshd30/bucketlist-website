import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME =
  "bla_admin_session";

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

  const sessionCookie =
    cookieStore.get(
      SESSION_COOKIE_NAME
    );

  if (!sessionCookie?.value) {
    return false;
  }

  const expectedToken =
    createSessionToken(
      adminUsername,
      sessionSecret
    );

  const expectedBuffer =
    Buffer.from(
      expectedToken,
      "utf8"
    );

  const receivedBuffer =
    Buffer.from(
      sessionCookie.value,
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
      }
    );
  }

  return null;
}