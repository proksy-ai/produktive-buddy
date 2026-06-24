import { NextResponse } from "next/server";
import { z } from "zod";

import { sendInvites } from "@/features/roster/service";
import { getAdminSession } from "@/lib/roles";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  onlyUninvited: z.boolean().optional(),
  limit: z.number().int().positive().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;

    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const appUrl =
      process.env.APP_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;

    const result = await sendInvites(`${appUrl}/login`, {
      onlyUninvited: body.onlyUninvited,
      limit: body.limit,
    });

    await auditLog({
      actorId: session.id,
      action: "roster.invite",
      metadata: result,
      request,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    console.error("[admin/roster/invite]", err);
    return NextResponse.json({ error: "Invite send failed." }, { status: 500 });
  }
}
