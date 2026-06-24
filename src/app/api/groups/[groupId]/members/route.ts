import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const bodySchema = z.object({
  code: z.string().min(6).max(16),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const session = await requireSession();
    const { groupId } = await params;
    const { code } = bodySchema.parse(await request.json());

    const group = await db.group.findFirst({
      where: {
        id: groupId,
        members: { some: { userId: session.id, status: "ACTIVE" } },
      },
      select: { id: true },
    });
    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { friendCode: code.trim().toUpperCase() },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Friend code not found." }, { status: 404 });
    }

    await db.groupMember.upsert({
      where: { groupId_userId: { groupId, userId: user.id } },
      create: { groupId, userId: user.id, status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });

    return NextResponse.json({ ok: true, member: user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid friend code." }, { status: 400 });
    }
    console.error("[groups/members]", err);
    return NextResponse.json({ error: "Could not add member." }, { status: 500 });
  }
}
