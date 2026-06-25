import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { sendToUser } from "@/lib/push";
import {
  error as logError,
  isUnauthorizedError,
  requestLogContext,
} from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/csrf";

export async function POST(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const sent = await sendToUser(session.id, {
      title: "Produktive Buddy works 🎉",
      body: "Notifications are on. We'll only ping you when it matters.",
      url: "/today",
      tag: "produktive-buddy-test",
    });
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    if (isUnauthorizedError(err)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logError("push.test.failed", err, {
      ...logCtx,
      status: 500,
      durationMs: Date.now() - started,
      errorCode: "PUSH_TEST_FAILED",
    });
    return NextResponse.json({ error: "Could not send test notification." }, { status: 500 });
  }
}
