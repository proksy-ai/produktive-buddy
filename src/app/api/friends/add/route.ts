import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const bodySchema = z.object({
  code: z.string().min(6).max(16),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { code } = bodySchema.parse(await request.json());

    const target = await db.user.findUnique({
      where: { friendCode: code.trim().toUpperCase() },
      select: { id: true, name: true, email: true },
    });
    if (!target || target.id === session.id) {
      return NextResponse.json({ error: "Friend code not found." }, { status: 404 });
    }

    const [a, b] = [session.id, target.id].sort();
    await db.friendship.upsert({
      where: { fromId_toId: { fromId: a, toId: b } },
      create: {
        fromId: a,
        toId: b,
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
      update: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      friend: { id: target.id, name: target.name, email: target.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid friend code." }, { status: 400 });
    }
    console.error("[friends/add]", err);
    return NextResponse.json({ error: "Could not add friend." }, { status: 500 });
  }
}
