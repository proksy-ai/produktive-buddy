import { NextResponse } from "next/server";
import { z } from "zod";

import { canonicalAppUrl } from "@/lib/app-url";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  calendarLinks,
  createCalendarShare,
  listActiveCalendarShares,
  revokeCalendarShare,
  revokeCalendarToken,
  rotateCalendarToken,
  shareExpiresAt,
  ensureCalendarToken,
} from "@/modules/calendar/application/share-service";
import { auditLog } from "@/server/audit/service";
import {
  error as logError,
  requestLogContext,
} from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/csrf";

const shareSchema = z.object({
  action: z.literal("createShare").optional(),
  scope: z.enum(["DAY", "WEEK", "ALL_TIME", "CUSTOM"]),
  startsOn: z.string().optional(),
  endsOn: z.string().optional(),
});

const actionSchema = z.object({
  action: z.enum(["ensureToken", "rotateToken"]),
});

export async function GET(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  try {
    const session = await requireSession();
    const origin = canonicalAppUrl(request);

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { calendarToken: true, calendarPreference: true },
    });
    const shares = await listActiveCalendarShares(session.id, origin);

    return NextResponse.json({
      links: user?.calendarToken ? calendarLinks(origin, user.calendarToken) : null,
      shares,
      calendarPreference: user?.calendarPreference,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logError("calendar.link.get.failed", err, {
      ...logCtx,
      status: 500,
      durationMs: Date.now() - started,
      errorCode: "CALENDAR_LINK_GET_FAILED",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const origin = canonicalAppUrl(request);

    const text = await request.text();
    if (text.trim()) {
      const payload = JSON.parse(text) as unknown;
      if (typeof payload === "object" && payload && "scope" in payload) {
        const input = shareSchema.parse(payload);
        const share = await createCalendarShare({
          userId: session.id,
          scope: input.scope,
          startsOn: input.startsOn,
          endsOn: input.endsOn,
        });

        const shareView = {
          token: share.token,
          scope: share.scope,
          startsOn: share.startsOn,
          endsOn: share.endsOn,
          createdAt: share.createdAt,
          expiresAt: shareExpiresAt(share),
          links: calendarLinks(origin, share.token),
        };

        await auditLog({
          actorId: session.id,
          action: "calendar.share.create",
          resource: share.scope,
          request,
        });

        return NextResponse.json({
          ok: true,
          share: shareView,
          shares: await listActiveCalendarShares(session.id, origin),
        });
      }

      const action = actionSchema.parse(payload);
      if (action.action === "ensureToken") {
        const user = await ensureCalendarToken(session.id);
        return NextResponse.json({
          ok: true,
          links: user.calendarToken ? calendarLinks(origin, user.calendarToken) : null,
          calendarPreference: user.calendarPreference,
          shares: await listActiveCalendarShares(session.id, origin),
        });
      }

      const user = await rotateCalendarToken(session.id);
      await auditLog({
        actorId: session.id,
        action: "calendar.token.rotate",
        request,
      });
      return NextResponse.json({
        ok: true,
        links: user.calendarToken ? calendarLinks(origin, user.calendarToken) : null,
        calendarPreference: user.calendarPreference,
        shares: await listActiveCalendarShares(session.id, origin),
      });
    }

    const user = await rotateCalendarToken(session.id);
    await auditLog({
      actorId: session.id,
      action: "calendar.token.rotate",
      request,
    });
    return NextResponse.json({
      ok: true,
      links: user.calendarToken ? calendarLinks(origin, user.calendarToken) : null,
      calendarPreference: user.calendarPreference,
      shares: await listActiveCalendarShares(session.id, origin),
    });
  } catch (err) {
    if (err instanceof z.ZodError || err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid share request." }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.includes("Share start date")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    logError("calendar.link.post.failed", err, {
      ...logCtx,
      status: 500,
      durationMs: Date.now() - started,
      errorCode: "CALENDAR_LINK_POST_FAILED",
    });
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const started = Date.now();
  const logCtx = requestLogContext(request);
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const origin = canonicalAppUrl(request);
    const shareToken = new URL(request.url).searchParams.get("shareToken");

    if (shareToken) {
      const revoked = await revokeCalendarShare(session.id, shareToken);
      if (!revoked) {
        return NextResponse.json(
          { error: "Share token not found." },
          { status: 404 },
        );
      }
      await auditLog({
        actorId: session.id,
        action: "calendar.share.revoke",
        resource: shareToken,
        request,
      });
      return NextResponse.json({
        ok: true,
        shares: await listActiveCalendarShares(session.id, origin),
      });
    }

    await revokeCalendarToken(session.id);
    await auditLog({
      actorId: session.id,
      action: "calendar.token.revoke",
      request,
    });
    return NextResponse.json({
      ok: true,
      links: null,
      shares: await listActiveCalendarShares(session.id, origin),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logError("calendar.link.delete.failed", err, {
      ...logCtx,
      status: 500,
      durationMs: Date.now() - started,
      errorCode: "CALENDAR_LINK_DELETE_FAILED",
    });
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }
}
