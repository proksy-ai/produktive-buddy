import { NextResponse } from "next/server";

export function assertSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const expected = new URL(request.url).origin;
  if (origin !== expected) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  return null;
}
