import { NextResponse } from "next/server";

import { dispatchPendingNotifications } from "@/lib/notify";
import { syncAllSheetSources, syncSheetSource } from "@/lib/sheets/sync";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const sheetSourceId = url.searchParams.get("sheetSourceId");

    const results = sheetSourceId
      ? [await syncSheetSource(sheetSourceId)]
      : await syncAllSheetSources();

    const notifications = await dispatchPendingNotifications();

    return NextResponse.json({ ok: true, results, notifications });
  } catch (err) {
    console.error("[cron/sync-sheets]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}

/** Vercel Cron invokes GET by default. */
export async function GET(request: Request) {
  return POST(request);
}
