import { NextResponse } from "next/server";

import { getSession, SESSION_COOKIE } from "@/lib/auth/session";
import { auditLog } from "@/server/audit/service";
import { info as logInfo, requestLogContext } from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/csrf";

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

export async function POST(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;
  const session = await getSession();
  await auditLog({
    actorId: session?.id,
    action: "auth.logout",
    request,
  });
  logInfo("auth.logout", {
    ...logCtx,
    actorId: session?.id,
    status: 200,
    durationMs: Date.now() - started,
    errorCode: "AUTH_LOGOUT_OK",
  });
  return clearSessionCookie(NextResponse.json({ ok: true }));
}

export async function GET() {
  return NextResponse.json(
    { error: "Use POST /api/auth/logout." },
    {
      status: 405,
      headers: { Allow: "POST" },
    },
  );
}
