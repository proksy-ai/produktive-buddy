import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  error as logError,
  isUnauthorizedError,
  requestLogContext,
} from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({ endpoint: z.string().url() });

export async function POST(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const { endpoint } = bodySchema.parse(await request.json());

    await db.pushSubscription.deleteMany({
      where: { endpoint, userId: session.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isUnauthorizedError(err)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logError("push.unsubscribe.failed", err, {
      ...logCtx,
      status: 500,
      durationMs: Date.now() - started,
      errorCode: "PUSH_UNSUBSCRIBE_FAILED",
    });
    return NextResponse.json({ error: "Could not remove subscription." }, { status: 500 });
  }
}
