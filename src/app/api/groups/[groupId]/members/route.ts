import { NextResponse } from "next/server";
import { z } from "zod";

import { addGroupMemberByCode } from "@/features/social/service";
import { requireSession } from "@/lib/auth/session";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  code: z.string().min(6).max(16),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const { groupId } = await params;
    const { code } = bodySchema.parse(await request.json());
    const user = await addGroupMemberByCode(session.id, groupId, code);
    await auditLog({
      actorId: session.id,
      action: "group.member.add",
      resource: groupId,
      metadata: { memberId: user.id },
      request,
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
