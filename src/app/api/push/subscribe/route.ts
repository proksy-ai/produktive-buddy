import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  error as logError,
  info as logInfo,
  isUnauthorizedError,
  requestLogContext,
} from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const { endpoint, keys } = bodySchema.parse(await request.json());
    const userAgent = request.headers.get("user-agent") ?? undefined;

    await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
      update: { userId: session.id, p256dh: keys.p256dh, auth: keys.auth },
    });

    logInfo("push.subscribe.success", {
      ...logCtx,
      actorId: session.id,
      status: 200,
      durationMs: Date.now() - started,
      errorCode: "PUSH_SUBSCRIBE_OK",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      logInfo("push.subscribe.invalid", {
        ...logCtx,
        status: 400,
        durationMs: Date.now() - started,
        errorCode: "PUSH_SUBSCRIBE_INVALID",
      });
      return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    }
    if (isUnauthorizedError(err)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logError("push.subscribe.failed", err, {
      ...logCtx,
      status: 500,
      durationMs: Date.now() - started,
      errorCode: "PUSH_SUBSCRIBE_FAILED",
    });
    return NextResponse.json({ error: "Could not save subscription." }, { status: 500 });
  }
}
