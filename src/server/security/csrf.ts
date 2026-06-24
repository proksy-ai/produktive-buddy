import { NextResponse } from "next/server";

export function assertSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  // Non-browser / same-origin navigations may omit Origin entirely.
  if (!origin) return null;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  // Compare against the host the client actually used. This is resilient to
  // dev/proxy setups where request.url may resolve to a different internal host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const expectedHost = host ?? new URL(request.url).host;

  if (originHost !== expectedHost) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  return null;
}
