import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { addFriendByCode } from "@/modules/social/application/social-service";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  code: z.string().min(6).max(16),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const { code } = bodySchema.parse(await request.json());
    const target = await addFriendByCode(session.id, code);
    await auditLog({
      actorId: session.id,
      action: "friend.add",
      resource: target.id,
      request,
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
