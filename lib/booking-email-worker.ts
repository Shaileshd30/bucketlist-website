import {
  renderBookingEmail,
  type BookingEmailKind,
} from "@/lib/booking-email-template";
import { createBookingEmailTransport } from "@/lib/booking-email-transport";
import { supabaseAdmin } from "@/lib/supabase-server";
import { readFile } from "node:fs/promises";
import path from "node:path";

type EmailJob = {
  id: string;
  lock_token: string;
  recipient_email: string;
  email_kind: BookingEmailKind;
  payload: unknown;
};

type DeliveryResult = {
  status:
    | "DISABLED"
    | "EMPTY"
    | "SENT"
    | "DELIVERY_FAILED"
    | "DELIVERY_UNCERTAIN";
  emailId?: string;
};

function smtpErrorDetails(error: unknown): {
  description: string;
  retryable: boolean;
} {
  const details =
    typeof error === "object" && error !== null
      ? (error as Record<string, unknown>)
      : {};

  const code =
    typeof details.code === "string" &&
    /^[A-Z0-9_]+$/.test(details.code)
      ? details.code
      : "SMTP_ERROR";

  const responseCode =
    typeof details.responseCode === "number" &&
    Number.isInteger(details.responseCode)
      ? details.responseCode
      : null;

  return {
    // Store codes only, not credentials or full SMTP responses.
    description: responseCode
      ? `${code}: SMTP ${responseCode}`
      : code,
    retryable:
      code !== "EAUTH" &&
      code !== "EENVELOPE" &&
      !(responseCode !== null && responseCode >= 500),
  };
}

async function recordFailure(
  job: EmailJob,
  description: string,
  retryable: boolean
): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc(
    "fail_booking_email",
    {
      p_email_id: job.id,
      p_lock_token: job.lock_token,
      p_error: description,
      p_retryable: retryable,
    }
  );

  if (error || data !== true) {
    throw new Error("Unable to record email delivery failure.");
  }
}

export async function processNextBookingEmail(): Promise<DeliveryResult> {
  if (process.env.BOOKING_EMAIL_ENABLED !== "true") {
    return { status: "DISABLED" };
  }

  const {
    transport,
    from,
    replyTo,
    testRecipient,
  } = createBookingEmailTransport();

  try {
    /*
     * Test redirection is permitted only against local Supabase.
     * This prevents tests from marking production emails as sent.
     */
    if (testRecipient) {
      const databaseHost = new URL(
        process.env.SUPABASE_URL || ""
      ).hostname;

      if (
        databaseHost !== "localhost" &&
        databaseHost !== "127.0.0.1" &&
        databaseHost !== "[::1]"
      ) {
        throw new Error(
          "Email test mode requires a local Supabase database."
        );
      }
    }

    const { data, error } = await supabaseAdmin.rpc(
      "claim_booking_email"
    );

    if (error) {
      throw new Error("Unable to claim a queued email.");
    }

    const job = (data as EmailJob[] | null)?.[0];

    if (!job) {
      return { status: "EMPTY" };
    }

    let rendered: ReturnType<typeof renderBookingEmail>;
    let recipient: string;

    try {
      rendered = renderBookingEmail(job.email_kind, job.payload);
      recipient = (testRecipient || job.recipient_email).trim();

      if (
        !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(recipient)
      ) {
        throw new Error("Invalid recipient.");
      }
    } catch {
      await recordFailure(
        job,
        "Invalid email payload or recipient.",
        false
      );

      return {
        status: "DELIVERY_FAILED",
        emailId: job.id,
      };
    }

    /*
     * Use the same Message-ID for retries.
     * This helps tracing but does not guarantee deduplication
     * by the receiving mail server.
     */
    const messageId =
      `<booking-email-${job.id}@bucketlistadventure.in>`;

    try {
      const logoContent = await readFile(
  path.join(process.cwd(), "public", "bucketlist-logo.png")
);  
      const result = await transport.sendMail({
        from,
        to: { address: recipient, name: "" },
        replyTo,
        messageId,
        subject: testRecipient
          ? `[TEST] ${rendered.subject}`
          : rendered.subject,
        text: rendered.text,
        html: rendered.html,
        attachments: [
  {
    filename: "bucketlist-logo.png",
    content: logoContent,
    contentType: "image/png",
    contentDisposition: "inline",
    cid: "booking-logo@bucketlistadventure.in",
  },
],
      });

      if (!result.accepted || result.accepted.length === 0) {
        await recordFailure(
          job,
          "SMTP did not accept the recipient.",
          false
        );

        return {
          status: "DELIVERY_FAILED",
          emailId: job.id,
        };
      }
    } catch (error) {
      const failure = smtpErrorDetails(error);

      await recordFailure(
        job,
        failure.description,
        failure.retryable
      );

      return {
        status: "DELIVERY_FAILED",
        emailId: job.id,
      };
    }

    /*
     * SMTP accepted the message. A database failure here
     * must not be treated as a new SMTP failure.
     */
    try {
      const { data: completed, error: completionError } =
        await supabaseAdmin.rpc("complete_booking_email", {
          p_email_id: job.id,
          p_lock_token: job.lock_token,
          p_smtp_message_id: messageId,
        });

      if (completionError || completed !== true) {
        return {
          status: "DELIVERY_UNCERTAIN",
          emailId: job.id,
        };
      }
    } catch {
      return {
        status: "DELIVERY_UNCERTAIN",
        emailId: job.id,
      };
    }

    return {
      status: "SENT",
      emailId: job.id,
    };
  } finally {
    transport.close();
  }
}