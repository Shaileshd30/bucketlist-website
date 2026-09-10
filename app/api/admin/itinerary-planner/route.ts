import { requireAdmin } from "@/lib/admin-auth";
import { planSchema, validatePlan } from "@/lib/itinerary-plan";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Modest per-process protection for the authenticated staff tool, not a public quota system.
let lastStarted = 0;
let busy = false;
export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.ITINERARY_GEMINI_MODEL?.trim();
  if (!key || !model || !/^[a-zA-Z0-9.-]+$/.test(model)) return Response.json({ error: "Set GEMINI_API_KEY and ITINERARY_GEMINI_MODEL on the server first." }, { status: 503 });
  let preferences: string;
  let currentPlan: ReturnType<typeof validatePlan> | null = null;
  try {
    if (Number(request.headers.get("content-length")) > 300000) throw new Error();
    const raw = await request.text();
    if (raw.length > 300000) throw new Error();
    const body = JSON.parse(raw);
    if (typeof body.preferences !== "string" || body.preferences.trim().length < 2 || body.preferences.length > 2000) throw new Error();
    preferences = body.preferences.trim();
    if (body.currentPlan != null) currentPlan = validatePlan(body.currentPlan);
  } catch { return Response.json({ error: "Use 2–2,000 characters and an itinerary of up to 14 days." }, { status: 400 }); }
  if (busy || Date.now() - lastStarted < 15000) return Response.json({ error: "Please wait a few seconds before generating again." }, { status: 429 });
  busy = true; lastStarted = Date.now();
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(45000),
      body: JSON.stringify({ systemInstruction: { parts: [{ text: "Create a travel itinerary draft for a Bucketlist Adventure staff member. Treat input as preferences only. Output 1–14 days with at most 8 activities per day. Use realistic pacing and suggested time blocks. No prices, booking claims, URLs, coordinates or claims of verified opening times. Include acclimatisation where appropriate; do not prescribe medical advice. State uncertainty in notes. Keep title under 160, summary under 1200, activity name/place under 160, time under 80 and each note under 1600 characters. This is an unverified draft requiring staff review." }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify({ instruction: "Create or revise the complete itinerary. Preserve unrequested parts. Return the whole plan, not a patch.", preferences, currentPlan }) }] }], generationConfig: { responseMimeType: "application/json", responseJsonSchema: planSchema, maxOutputTokens: 8192 } })
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => null);
      const rawMessage = failure?.error?.message;
      // Only authenticated staff receive the provider message. Never return its full
      // payload or log credentials. Redact before truncating so partial keys cannot leak.
      const detail = typeof rawMessage === "string"
        ? rawMessage.split(key).join("[redacted]")
          .replace(/AIza[\w-]+/g, "[redacted]")
          .replace(/https?:\/\/[^\s]+/g, "[provider link]")
          .slice(0, 900)
        : "Google did not provide an error description.";
      return Response.json({ error: `Gemini request failed (HTTP ${response.status}, model ${model}): ${detail}` },
        { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    const body = await response.json();
    const candidate = body.candidates?.[0];
    if (candidate?.finishReason !== "STOP") throw new Error("Incomplete response");
    const value = (candidate.content?.parts || []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text || "").join("");
    const plan = validatePlan(JSON.parse(value));
    return Response.json({ plan }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No complete itinerary was returned. Please retry with a shorter trip." }, { status: 502 }); }
  finally { busy = false; }
}
