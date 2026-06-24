import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const bodySchema = z.object({
  sessionId: z.string(),
  // "CLEAR" removes the mark (back to default present).
  status: z.enum(["PRESENT", "ABSENT", "CLEAR"]),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { sessionId, status } = bodySchema.parse(await request.json());

    // Confirm the session is in the user's active term.
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { activeTermId: true },
    });
    const klass = await db.session.findUnique({
      where: { id: sessionId },
      select: { termId: true },
    });
    if (!user?.activeTermId || klass?.termId !== user.activeTermId) {
      return NextResponse.json({ error: "Invalid class." }, { status: 400 });
    }

    if (status === "CLEAR") {
      await db.attendance.deleteMany({
        where: { userId: session.id, sessionId },
      });
      return NextResponse.json({ ok: true, status: null });
    }

    await db.attendance.upsert({
      where: { userId_sessionId: { userId: session.id, sessionId } },
      create: { userId: session.id, sessionId, status },
      update: { status },
    });

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    console.error("[attendance]", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
