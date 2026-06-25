import { NextResponse } from "next/server";

import {
  clearStateCookieOptions,
  exchangeGoogleCode,
  GOOGLE_OAUTH_STATE_COOKIE,
  parseGoogleState,
  publicAppUrl,
  verifyGoogleIdToken,
} from "@/lib/auth/google";
import {
  isInstituteEmail,
  normalizeInstituteEmail,
  resolveBatchFromEmail,
} from "@/lib/auth/email-prefix";
import { sessionCookieOptions } from "@/lib/auth/session";
import { signInInstituteUser } from "@/modules/auth/application/sign-in";
import { auditLog } from "@/server/audit/service";
import {
  error as logError,
  info as logInfo,
  requestLogContext,
} from "@/server/observability/logger";

function loginRedirect(requestUrl: string, error: string) {
  const url = new URL("/login", publicAppUrl(requestUrl));
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const storedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_OAUTH_STATE_COOKIE}=`))
    ?.slice(GOOGLE_OAUTH_STATE_COOKIE.length + 1);

  const parsedState = parseGoogleState(storedState);
  const stateMatches = Boolean(
    returnedState && storedState && returnedState === storedState,
  );

  if (!code || !parsedState || !stateMatches) {
    logInfo("auth.google.state_invalid", {
      ...logCtx,
      status: 401,
      durationMs: Date.now() - started,
      errorCode: "AUTH_GOOGLE_STATE_INVALID",
    });
    const response = loginRedirect(request.url, "Google sign-in expired. Try again.");
    response.cookies.set(clearStateCookieOptions());
    return response;
  }

  try {
    const idToken = await exchangeGoogleCode({ code, requestUrl: request.url });
    const profile = await verifyGoogleIdToken(idToken);
    const email = normalizeInstituteEmail(profile.email);

    if (!profile.emailVerified) {
      throw new Error("Google account email is not verified.");
    }
    if (profile.hostedDomain && profile.hostedDomain !== "iimk.ac.in") {
      throw new Error("Use your IIMK Google Workspace account.");
    }
    if (!isInstituteEmail(email)) {
      throw new Error("Use your @iimk.ac.in institute email.");
    }

    const batch = await resolveBatchFromEmail(email);
    if (!batch) {
      throw new Error("This IIMK email prefix is not registered yet.");
    }

    const { user, token } = await signInInstituteUser({
      email,
      name: profile.name,
      batchId: batch.id,
    });
    await auditLog({
      actorId: user.id,
      action: "auth.google.verify",
      metadata: { batchLabel: user.batchLabel },
      request,
    });
    logInfo("auth.google.success", {
      ...logCtx,
      actorId: user.id,
      status: 302,
      durationMs: Date.now() - started,
      errorCode: "AUTH_GOOGLE_OK",
    });

    const response = NextResponse.redirect(
      new URL(parsedState.next, publicAppUrl(request.url)),
    );
    response.cookies.set(clearStateCookieOptions());
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    await auditLog({
      action: "auth.google.failure",
      metadata: {
        reason: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      },
      severity: "WARN",
      request,
    });
    logError("auth.google.failed", err, {
      ...logCtx,
      status: 401,
      durationMs: Date.now() - started,
      errorCode: "AUTH_GOOGLE_FAILED",
    });
    const message =
      err instanceof Error ? err.message : "Google sign-in failed. Try again.";
    const response = loginRedirect(request.url, message);
    response.cookies.set(clearStateCookieOptions());
    return response;
  }
}
