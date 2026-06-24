import { db } from "@/lib/db";

export async function replaceActiveTermEnrollments(
  userId: string,
  courseIds: string[],
  sectionByCourse: Record<string, string | undefined> = {},
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { activeTermId: true },
  });
  if (!user?.activeTermId) throw new Error("No active term.");

  const courses = await db.course.findMany({
    where: { id: { in: courseIds }, termId: user.activeTermId },
    include: { sections: true },
  });
  if (courses.length === 0) throw new Error("No valid courses.");

  await db.$transaction(async (tx) => {
    await tx.enrollment.deleteMany({
      where: { userId, termId: user.activeTermId! },
    });
    for (const c of courses) {
      const requestedSection = sectionByCourse[c.id];
      const section =
        (requestedSection
          ? c.sections.find((s) => s.code === requestedSection)
          : null) ?? (c.sections.length === 1 ? c.sections[0] : null);

      await tx.enrollment.create({
        data: {
          userId,
          termId: user.activeTermId!,
          courseId: c.id,
          courseSectionId: section?.id ?? null,
        },
      });
    }
  });

  return { count: courses.length };
}
