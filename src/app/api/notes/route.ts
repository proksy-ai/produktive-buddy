import { NextResponse } from "next/server";
import { z } from "zod";

import { saveSessionNote } from "@/features/notes/service";
import { requireSession } from "@/lib/auth/session";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  sessionId: z.string(),
  body: z.string().max(8000),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());
    const note = await saveSessionNote(session.id, body.sessionId, body.body);
    await auditLog({
      actorId: session.id,
      action: note ? "note.upsert" : "note.delete",
      resource: body.sessionId,
      request,
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
