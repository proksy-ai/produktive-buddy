import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { createFriendCode, getFriendCode } from "@/lib/friends";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json({
      friendCode: await getFriendCode(session.id),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;

    const session = await requireSession();
    const existing = await getFriendCode(session.id);
    const friendCode = existing ?? (await createFriendCode(session.id));

    if (!existing) {
      await auditLog({
        actorId: session.id,
        action: "friend.code.create",
        request,
      });
    }

    return NextResponse.json({ ok: true, friendCode });
  } catch {
    return NextResponse.json({ error: "Could not generate friend code." }, { status: 500 });
  }
}
