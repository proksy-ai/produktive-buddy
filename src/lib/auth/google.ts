import { createRemoteJWKSet, jwtVerify } from "jose";

import { canonicalAppUrl } from "@/lib/app-url";
import { safeNextPath } from "@/lib/auth/redirect";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const STATE_TTL_SEC = 10 * 60;

export const GOOGLE_OAUTH_STATE_COOKIE = "pb_google_oauth_state";

export class GoogleAuthConfigError extends Error {
  constructor() {
    super("Google authentication is not configured.");
    this.name = "GoogleAuthConfigError";
  }
}

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  hostedDomain: string | null;
  name: string | null;
}

function googleClientId() {
  const value = process.env.GOOGLE_CLIENT_ID;
  if (!value) throw new GoogleAuthConfigError();
  return value;
}

function googleClientSecret() {
  const value = process.env.GOOGLE_CLIENT_SECRET;
  if (!value) throw new GoogleAuthConfigError();
  return value;
}

export function oauthRedirectUri(requestUrl: string) {
  return new URL("/api/auth/google/callback", publicAppUrl(requestUrl)).toString();
}

export function publicAppUrl(requestUrl: string) {
  return canonicalAppUrl(requestUrl);
}

export function createGoogleState(next: string) {
  return {
    nonce: crypto.randomUUID(),
    next: safeNextPath(next),
  };
}

export function serializeGoogleState(state: ReturnType<typeof createGoogleState>) {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function parseGoogleState(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      typeof parsed?.nonce !== "string" ||
      typeof parsed?.next !== "string" ||
      safeNextPath(parsed.next) !== parsed.next
    ) {
      return null;
    }
    return parsed as ReturnType<typeof createGoogleState>;
  } catch {
    return null;
  }
}

export function stateCookieOptions(value: string) {
  return {
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: STATE_TTL_SEC,
  };
}

export function clearStateCookieOptions() {
  return {
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export function googleAuthorizationUrl({
  requestUrl,
  state,
}: {
  requestUrl: string;
  state: string;
}) {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", googleClientId());
  url.searchParams.set("redirect_uri", oauthRedirectUri(requestUrl));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("hd", "iimk.ac.in");
  url.searchParams.set("prompt", "select_account");
  return url;
}

export async function exchangeGoogleCode({
  code,
  requestUrl,
}: {
  code: string;
  requestUrl: string;
}) {
  const body = new URLSearchParams({
    code,
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
    redirect_uri: oauthRedirectUri(requestUrl),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GoogleAuthError(
      `Google token exchange failed (${response.status}): ${detail.slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as { id_token?: string };
  if (!payload.id_token) {
    throw new GoogleAuthError("Google did not return an identity token.");
  }
  return payload.id_token;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUER,
    audience: googleClientId(),
  });

  const email = typeof payload.email === "string" ? payload.email : "";
  const name = typeof payload.name === "string" ? payload.name : null;
  const hostedDomain = typeof payload.hd === "string" ? payload.hd : null;
  const emailVerified = payload.email_verified === true;

  if (!email) throw new GoogleAuthError("Google account did not include an email.");

  return {
    email,
    emailVerified,
    hostedDomain,
    name,
  };
}
