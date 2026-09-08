import nodemailer from "nodemailer";

function requiredSetting(name: string): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing email setting: ${name}`);
  }

  return value;
}

export function createBookingEmailTransport() {
  if (process.env.BOOKING_EMAIL_ENABLED !== "true") {
    throw new Error("Booking email sending is disabled.");
  }

  const host = requiredSetting("SMTP_HOST").trim();
  const port = Number(requiredSetting("SMTP_PORT"));
  const secure = requiredSetting("SMTP_SECURE") === "true";
  const user = requiredSetting("SMTP_USER").trim();
  const password = requiredSetting("SMTP_PASSWORD");
  const from = requiredSetting("EMAIL_FROM").trim();

  if (port !== 465 || !secure) {
    throw new Error(
      "Booking email requires SMTP port 465 with TLS enabled."
    );
  }

  const testRecipient =
    process.env.BOOKING_EMAIL_TEST_RECIPIENT?.trim() || null;

  /*
   * Require an explicit destination override in development.
   * The worker will use this instead of the customer address.
   */
  if (
    process.env.NODE_ENV !== "production" &&
    !testRecipient
  ) {
    throw new Error(
      "A test recipient is required for local email sending."
    );
  }

  if (
    testRecipient &&
    !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(testRecipient)
  ) {
    throw new Error("Invalid booking email test recipient.");
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass: password,
    },
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });

  return {
    transport,
    from,
    replyTo: user,
    testRecipient,
  };
}