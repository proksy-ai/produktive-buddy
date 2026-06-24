import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const bodySchema = z.object({
  sessionId: z.string(),
  body: z.string().max(8000),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { activeTermId: true },
    });
    const klass = await db.session.findUnique({
      where: { id: body.sessionId },
      select: { termId: true },
    });

    if (!user?.activeTermId || klass?.termId !== user.activeTermId) {
      return NextResponse.json({ error: "Invalid class." }, { status: 400 });
    }

    const trimmed = body.body.trim();
    if (!trimmed) {
      await db.sessionNote.deleteMany({
        where: { userId: session.id, sessionId: body.sessionId },
      });
      return NextResponse.json({ ok: true, note: null });
    }

    const note = await db.sessionNote.upsert({
      where: {
        userId_sessionId: { userId: session.id, sessionId: body.sessionId },
      },
      create: { userId: session.id, sessionId: body.sessionId, body: trimmed },
      update: { body: trimmed },
    });

    return NextResponse.json({ ok: true, note });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid note." }, { status: 400 });
    }
    console.error("[notes]", err);
    return NextResponse.json({ error: "Could not save note." }, { status: 500 });
  }
}
