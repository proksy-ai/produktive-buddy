import { NextResponse } from "next/server";

import {
  createGoogleState,
  googleAuthorizationUrl,
  serializeGoogleState,
  stateCookieOptions,
} from "@/lib/auth/google";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = serializeGoogleState(
    createGoogleState(url.searchParams.get("next") ?? "/today"),
  );
  const response = NextResponse.redirect(
    googleAuthorizationUrl({ requestUrl: request.url, state }),
  );
  response.cookies.set(stateCookieOptions(state));
  return response;
}
