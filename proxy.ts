import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  //
  // Canonical domain:
  // www.bucketlistadventure.in → bucketlistadventure.in
  //
  const forwardedHost = request.headers.get("x-forwarded-host");
const host = request.headers.get("host");

const requestHost = (forwardedHost || host || "")
  .split(",")[0]
  .trim()
  .toLowerCase()
  .split(":")[0];

if (requestHost === "www.bucketlistadventure.in") {
  const canonicalUrl = request.nextUrl.clone();

  canonicalUrl.protocol = "https:";
  canonicalUrl.hostname = "bucketlistadventure.in";
  canonicalUrl.port = "";

  return NextResponse.redirect(canonicalUrl, 308);
}

  let decodedPath = pathname;

  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    decodedPath = pathname;
  }

  const path = decodedPath.toLowerCase();

  //
  // Legacy WordPress redirects
  //

  if (path.includes("weekend-treks")) {
    return NextResponse.redirect(
      new URL("/treks-near-pune", request.url),
      308
    );
  }

  if (path.includes("about-us")) {
    return NextResponse.redirect(
      new URL("/about", request.url),
      308
    );
  }

  if (path.includes("backpacking-tours")) {
    return NextResponse.redirect(
      new URL("/trips", request.url),
      308
    );
  }

  if (path.includes("-home")) {
    return NextResponse.redirect(
      new URL("/", request.url),
      308
    );
  }

  if (path.includes("destinations")) {
    return NextResponse.redirect(
      new URL("/trips", request.url),
      308
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml).*)",
  ],
};