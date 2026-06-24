import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

function token() {
  return randomBytes(24).toString("base64url");
}

function calendarLinks(origin: string, tokenValue: string) {
  const httpUrl = `${origin}/api/calendar/${tokenValue}.ics`;
  const webcalUrl = httpUrl.replace(/^https?:/, "webcal:");
  return {
    httpUrl,
    webcalUrl,
    appleUrl: webcalUrl,
    googleUrl: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpUrl)}`,
  };
}

const shareSchema = z.object({
  scope: z.enum(["DAY", "WEEK", "ALL_TIME", "CUSTOM"]),
  startsOn: z.string().optional(),
  endsOn: z.string().optional(),
});

function dateAtUtcMidnight(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function defaultRange(scope: z.infer<typeof shareSchema>["scope"]) {
  const today = dateAtUtcMidnight(todayYmd());
  if (scope === "DAY") {
    return { startsOn: today, endsOn: today };
  }
  if (scope === "WEEK") {
    const start = new Date(today);
    const dow = (start.getUTCDay() + 6) % 7;
    start.setUTCDate(start.getUTCDate() - dow);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    return { startsOn: start, endsOn: end };
  }
  return { startsOn: null, endsOn: null };
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();

    let user = await db.user.findUnique({
      where: { id: session.id },
      select: { calendarToken: true, calendarPreference: true },
    });

    if (!user?.calendarToken) {
      user = await db.user.update({
        where: { id: session.id },
        data: { calendarToken: token() },
        select: { calendarToken: true, calendarPreference: true },
      });
    }

    const origin = new URL(request.url).origin;
    const calendarToken = user.calendarToken;
    if (!calendarToken) throw new Error("Calendar token was not created.");

    return NextResponse.json({
      ...calendarLinks(origin, calendarToken),
      calendarPreference: user.calendarPreference,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();

    const text = await request.text();
    if (text.trim()) {
      const input = shareSchema.parse(JSON.parse(text));
      const fallback = defaultRange(input.scope);
      const startsOn = input.startsOn
        ? dateAtUtcMidnight(input.startsOn)
        : fallback.startsOn;
      const endsOn = input.endsOn ? dateAtUtcMidnight(input.endsOn) : fallback.endsOn;

      const share = await db.calendarShare.create({
        data: {
          userId: session.id,
          token: token(),
          scope: input.scope,
          startsOn,
          endsOn,
        },
        select: { token: true, scope: true, startsOn: true, endsOn: true },
      });

      await auditLog({
        actorId: session.id,
        action: "calendar.share.create",
        resource: share.scope,
        request,
      });

      const origin = new URL(request.url).origin;
      return NextResponse.json({
        ok: true,
        ...calendarLinks(origin, share.token),
        scope: share.scope,
        startsOn: share.startsOn,
        endsOn: share.endsOn,
      });
    }

    const user = await db.user.update({
      where: { id: session.id },
      data: { calendarToken: token() },
      select: { calendarToken: true, calendarPreference: true },
    });
    await auditLog({
      actorId: session.id,
      action: "calendar.token.rotate",
      request,
    });
    const origin = new URL(request.url).origin;
    const calendarToken = user.calendarToken;
    if (!calendarToken) throw new Error("Calendar token was not rotated.");
    return NextResponse.json({
      ok: true,
      ...calendarLinks(origin, calendarToken),
      calendarPreference: user.calendarPreference,
    });
  } catch (err) {
    if (err instanceof z.ZodError || err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid share request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    await db.user.update({
      where: { id: session.id },
      data: { calendarToken: null },
    });
    await auditLog({
      actorId: session.id,
      action: "calendar.token.revoke",
      request,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
