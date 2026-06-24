import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET() {
  const started = Date.now();
  try {
    const [userCount, latestSync, failedSyncSources] = await Promise.all([
      db.user.count(),
      db.syncSnapshot.findFirst({
        orderBy: { fetchedAt: "desc" },
        select: { fetchedAt: true },
      }),
      db.sheetSource.count({ where: { lastSyncedAt: null } }),
    ]);

    return NextResponse.json({
      ok: true,
      service: "kairo",
      db: "ok",
      userCount,
      latestSyncAt: latestSync?.fetchedAt ?? null,
      unsyncedSheetSources: failedSyncSources,
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json(
      {
        ok: false,
        service: "kairo",
        db: "error",
        latencyMs: Date.now() - started,
      },
      { status: 503 },
    );
  }
}
