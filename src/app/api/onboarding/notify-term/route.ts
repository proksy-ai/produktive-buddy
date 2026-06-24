import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getBatchRule, resolveTermAvailability } from "@/lib/terms";
import { voice } from "@/lib/voice";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  termId: z.string(),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const { termId } = bodySchema.parse(await request.json());

    const term = await db.term.findFirst({
      where: { id: termId, batchId: session.batchId ?? undefined },
      include: {
        batch: true,
        _count: { select: { courses: true } },
      },
    });

    if (!term) {
      return NextResponse.json({ error: "Term not found." }, { status: 404 });
    }

    const availability = resolveTermAvailability(
      term.batch.label,
      term.number,
      term._count.courses > 0,
    );
    const batchRule = getBatchRule(term.batch.label);
    const isBatchWaitlist =
      batchRule.rollout === "coming_soon" && term.number === 1;

    if (availability === "live") {
      return NextResponse.json(
        { error: "This term is already available." },
        { status: 400 },
      );
    }

    if (availability === "hidden" && !isBatchWaitlist) {
      return NextResponse.json({ error: "Invalid term." }, { status: 400 });
    }

    await db.termNotifyRequest.upsert({
      where: { userId_termId: { userId: session.id, termId } },
      create: { userId: session.id, termId },
      update: {},
    });

    return NextResponse.json({
      ok: true,
      message: voice.termLocked.notifyDone,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    console.error("[onboarding/notify-term]", err);
    return NextResponse.json(
      { error: voice.termLocked.notifyError },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const { termId } = bodySchema.parse(await request.json());

    await db.termNotifyRequest.deleteMany({
      where: { userId: session.id, termId },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: voice.errors.generic }, { status: 500 });
  }
}
