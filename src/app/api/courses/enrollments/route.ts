import { NextResponse } from "next/server";
import { z } from "zod";

import { replaceActiveTermEnrollments } from "@/features/courses/service";
import { requireSession } from "@/lib/auth/session";
import { auditLog } from "@/server/audit/service";
import { assertSameOrigin } from "@/server/security/csrf";

const bodySchema = z.object({
  courseIds: z.array(z.string()).min(1),
  sectionByCourse: z.record(z.string(), z.enum(["A", "B", "C"])).optional(),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const { courseIds, sectionByCourse } = bodySchema.parse(await request.json());
    const result = await replaceActiveTermEnrollments(
      session.id,
      courseIds,
      sectionByCourse,
    );
    await auditLog({
      actorId: session.id,
      action: "courses.enrollments.replace",
      metadata: { count: result.count },
      request,
    });
    return NextResponse.json({ ok: true, count: result.count });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Pick at least one course." }, { status: 400 });
    }
    console.error("[courses/enrollments]", err);
    return NextResponse.json({ error: "Could not save courses." }, { status: 500 });
  }
}
