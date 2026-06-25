import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { REQUEST_ID_HEADER } from "@/server/observability/logger";

const PUBLIC_PREFIXES = [
  "/login",
  "/offline",
  "/healthz",
  "/api/auth",
  "/api/cron",
  "/api/calendar", // token-secured ICS feed; /link does its own session check
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function requestId(request: NextRequest) {
  return request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
}

function nextWithRequestId(request: NextRequest, id: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, id);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(REQUEST_ID_HEADER, id);
  return response;
}

function redirectWithRequestId(url: URL, id: string) {
  const response = NextResponse.redirect(url);
  response.headers.set(REQUEST_ID_HEADER, id);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const id = requestId(request);

  if (isPublic(pathname)) return nextWithRequestId(request, id);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return redirectWithRequestId(login, id);
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("AUTH_SECRET missing");
    return redirectWithRequestId(new URL("/login", request.url), id);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return nextWithRequestId(request, id);
  } catch {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return redirectWithRequestId(login, id);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|apple-icon|icon-).*)",
  ],
};
