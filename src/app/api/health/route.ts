import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { error as logError, info as logInfo, requestLogContext } from "@/server/observability/logger";

export async function GET(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  try {
    const [userCount, latestSync, failedSyncSources] = await Promise.all([
      db.user.count(),
      db.syncSnapshot.findFirst({
        orderBy: { fetchedAt: "desc" },
        select: { fetchedAt: true },
      }),
      db.sheetSource.count({ where: { lastSyncedAt: null } }),
    ]);

    const payload = NextResponse.json({
      ok: true,
      service: "produktive-buddy",
      db: "ok",
      userCount,
      latestSyncAt: latestSync?.fetchedAt ?? null,
      unsyncedSheetSources: failedSyncSources,
      latencyMs: Date.now() - started,
    });
    logInfo("health.diagnostics.ok", {
      ...logCtx,
      status: 200,
      durationMs: Date.now() - started,
      errorCode: "HEALTH_DIAGNOSTIC_OK",
    });
    return payload;
  } catch (err) {
    logError("health.diagnostics.failed", err, {
      ...logCtx,
      status: 503,
      durationMs: Date.now() - started,
      errorCode: "HEALTH_DIAGNOSTIC_FAILED",
    });
    return NextResponse.json(
      {
        ok: false,
        service: "produktive-buddy",
        db: "error",
        latencyMs: Date.now() - started,
      },
      { status: 503 },
    );
  }
}
