type JsonObject =
  Record<string, unknown>;

type JsonReadResult =
  | {
      ok: true;
      value: JsonObject;
    }
  | {
      ok: false;
      status: 400 | 413 | 415;
      error: string;
    };

export async function readLimitedJsonObject(
  request: Request,
  maximumBytes: number
): Promise<JsonReadResult> {
  const contentType =
    request.headers.get("content-type") || "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    return {
      ok: false,
      status: 415,
      error:
        "Content-Type must be application/json.",
    };
  }

  const declaredLength = Number(
    request.headers.get("content-length")
  );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumBytes
  ) {
    return {
      ok: false,
      status: 413,
      error: "Request body is too large.",
    };
  }

  if (!request.body) {
    return {
      ok: false,
      status: 400,
      error: "Invalid JSON request body.",
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;

    if (receivedBytes > maximumBytes) {
      await reader.cancel();

      return {
        ok: false,
        status: 413,
        error: "Request body is too large.",
      };
    }

    chunks.push(value);
  }

  const bodyBytes =
    new Uint8Array(receivedBytes);

  let offset = 0;

  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const parsed: unknown = JSON.parse(
      new TextDecoder().decode(bodyBytes)
    );

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {
        ok: false,
        status: 400,
        error: "Invalid JSON request body.",
      };
    }

    return {
      ok: true,
      value: parsed as JsonObject,
    };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Invalid JSON request body.",
    };
  }
}
type LimitedTextReadResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      status: 400 | 413;
      error: string;
    };

export async function readLimitedText(
  request: Request,
  maximumBytes: number
): Promise<LimitedTextReadResult> {
  const declaredLength = Number(
    request.headers.get("content-length")
  );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumBytes
  ) {
    return {
      ok: false,
      status: 413,
      error: "Request body is too large.",
    };
  }

  if (!request.body) {
    return {
      ok: false,
      status: 400,
      error: "Request body is required.",
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;

    if (receivedBytes > maximumBytes) {
      await reader.cancel();

      return {
        ok: false,
        status: 413,
        error: "Request body is too large.",
      };
    }

    chunks.push(value);
  }

  const bodyBytes =
    new Uint8Array(receivedBytes);

  let offset = 0;

  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return {
    ok: true,
    value: new TextDecoder().decode(bodyBytes),
  };
}