import { GroupKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { createGroup } from "@/modules/social/application/social-service";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  name: z.string().min(2).max(80),
  kind: z.nativeEnum(GroupKind).default("CUSTOM"),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());
    const group = await createGroup(session.id, body);
    await auditLog({
      actorId: session.id,
      action: "group.create",
      resource: group.id,
      metadata: { kind: group.kind },
      request,
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
