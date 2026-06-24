import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

function token() {
  return randomBytes(24).toString("base64url");
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();

    let user = await db.user.findUnique({
      where: { id: session.id },
      select: { calendarToken: true },
    });

    if (!user?.calendarToken) {
      user = await db.user.update({
        where: { id: session.id },
        data: { calendarToken: token() },
        select: { calendarToken: true },
      });
    }

    const origin = new URL(request.url).origin;
    const httpUrl = `${origin}/api/calendar/${user.calendarToken}.ics`;
    const webcalUrl = httpUrl.replace(/^https?:/, "webcal:");

    return NextResponse.json({ httpUrl, webcalUrl });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const user = await db.user.update({
      where: { id: session.id },
      data: { calendarToken: token() },
      select: { calendarToken: true },
    });
    await auditLog({
      actorId: session.id,
      action: "calendar.token.rotate",
      request,
    });
    const origin = new URL(request.url).origin;
    const httpUrl = `${origin}/api/calendar/${user.calendarToken}.ics`;
    return NextResponse.json({
      ok: true,
      httpUrl,
      webcalUrl: httpUrl.replace(/^https?:/, "webcal:"),
    });
  } catch {
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
