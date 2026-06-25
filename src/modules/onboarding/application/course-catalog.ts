import type { SessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export class OnboardingCourseAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OnboardingCourseAccessError";
    this.status = status;
  }
}

export async function listOnboardingCourses(
  session: SessionUser,
  termId: string,
) {
  if (!termId) {
    throw new OnboardingCourseAccessError("termId required", 400);
  }

  const term = await db.term.findFirst({
    where: {
      id: termId,
      batchId: session.batchId ?? undefined,
    },
    select: { id: true },
  });
  if (!term) {
    throw new OnboardingCourseAccessError(
      "Term is not accessible for this account.",
      403,
    );
  }

  const courses = await db.course.findMany({
    where: { termId: term.id },
    orderBy: { name: "asc" },
    include: { sections: { orderBy: { code: "asc" } } },
  });

  return courses.map((c) => ({
    id: c.id,
    abbr: c.abbr,
    name: c.name,
    faculty: c.faculty,
    credits: c.credits,
    sections: c.sections
      .map((s) => s.code)
      .filter((code) => code === "A" || code === "B" || code === "C"),
  }));
}
