import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST() {
  return clearSessionCookie(NextResponse.json({ ok: true }));
}

export async function GET(request: Request) {
  return clearSessionCookie(
    NextResponse.redirect(new URL("/login", request.url)),
  );
}
