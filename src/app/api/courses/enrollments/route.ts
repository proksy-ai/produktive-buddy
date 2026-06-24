import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const bodySchema = z.object({
  courseIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const { courseIds } = bodySchema.parse(await request.json());

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { activeTermId: true },
    });
    if (!user?.activeTermId) {
      return NextResponse.json({ error: "No active term." }, { status: 400 });
    }

    const courses = await db.course.findMany({
      where: { id: { in: courseIds }, termId: user.activeTermId },
      select: { id: true },
    });
    if (courses.length === 0) {
      return NextResponse.json({ error: "No valid courses." }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.enrollment.deleteMany({
        where: { userId: session.id, termId: user.activeTermId! },
      });
      for (const c of courses) {
        await tx.enrollment.create({
          data: {
            userId: session.id,
            termId: user.activeTermId!,
            courseId: c.id,
          },
        });
      }
    });

    return NextResponse.json({ ok: true, count: courses.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Pick at least one course." }, { status: 400 });
    }
    console.error("[courses/enrollments]", err);
    return NextResponse.json({ error: "Could not save courses." }, { status: 500 });
  }
}
