import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import {
  AttendanceOwnershipError,
  markStudentAttendance,
} from "@/modules/attendance/application/attendance-service";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  sessionId: z.string(),
  // "CLEAR" removes the mark (back to default present).
  status: z.enum(["PRESENT", "ABSENT", "CLEAR"]),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const { sessionId, status } = bodySchema.parse(await request.json());
    const saved = await markStudentAttendance(session.id, sessionId, status);
    await auditLog({
      actorId: session.id,
      action: "attendance.mark",
      resource: sessionId,
      metadata: { status },
      request,
    });
    return NextResponse.json({
      ok: true,
      status: saved,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (err instanceof AttendanceOwnershipError) {
      return NextResponse.json({ error: "Invalid class." }, { status: 400 });
    }
    console.error("[attendance]", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
