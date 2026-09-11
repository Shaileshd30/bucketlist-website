/**
 * Verifies browser mutations against the public host while remaining compatible
 * with reverse proxies that terminate HTTPS before forwarding to Next.js.
 */
export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  let originHost: string;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    originHost = parsed.host.toLowerCase();
  } catch {
    return false;
  }

  const forwardedHosts = (request.headers.get("x-forwarded-host") || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const hosts = [request.headers.get("host")?.trim().toLowerCase(), ...forwardedHosts]
    .filter((value): value is string => Boolean(value));

  try {
    hosts.push(new URL(request.url).host.toLowerCase());
  } catch {
    return false;
  }

  return hosts.includes(originHost);
}
