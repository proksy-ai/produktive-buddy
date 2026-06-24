import { GroupKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const bodySchema = z.object({
  name: z.string().min(2).max(80),
  kind: z.nativeEnum(GroupKind).default("CUSTOM"),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());

    const group = await db.group.create({
      data: {
        name: body.name.trim(),
        kind: body.kind,
        ownerId: session.id,
        members: {
          create: {
            userId: session.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        },
      },
      select: { id: true, name: true, kind: true },
    });

    return NextResponse.json({ ok: true, group });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Name the group first." }, { status: 400 });
    }
    console.error("[groups]", err);
    return NextResponse.json({ error: "Could not create group." }, { status: 500 });
  }
}
