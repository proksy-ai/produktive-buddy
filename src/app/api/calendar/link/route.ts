import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await requireSession();

    let user = await db.user.findUnique({
      where: { id: session.id },
      select: { calendarToken: true },
    });

    if (!user?.calendarToken) {
      const token = randomBytes(24).toString("base64url");
      user = await db.user.update({
        where: { id: session.id },
        data: { calendarToken: token },
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
