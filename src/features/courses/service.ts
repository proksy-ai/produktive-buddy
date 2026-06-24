import { db } from "@/lib/db";

export async function replaceActiveTermEnrollments(
  userId: string,
  courseIds: string[],
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { activeTermId: true },
  });
  if (!user?.activeTermId) throw new Error("No active term.");

  const courses = await db.course.findMany({
    where: { id: { in: courseIds }, termId: user.activeTermId },
    select: { id: true },
  });
  if (courses.length === 0) throw new Error("No valid courses.");

  await db.$transaction(async (tx) => {
    await tx.enrollment.deleteMany({
      where: { userId, termId: user.activeTermId! },
    });
    for (const c of courses) {
      await tx.enrollment.create({
        data: {
          userId,
          termId: user.activeTermId!,
          courseId: c.id,
        },
      });
    }
  });

  return { count: courses.length };
}
