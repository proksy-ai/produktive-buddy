import { db } from "@/lib/db";
import { isElectiveTerm, termRequiresCohortSection } from "@/lib/onboarding";
import { resolveTermAvailability } from "@/lib/terms";
import { voice } from "@/lib/voice";

export interface CompleteOnboardingInput {
  sessionId: string;
  sessionBatchId: string | null;
  name: string;
  rollNumber?: string | null;
  calendarPreference?: "GOOGLE" | "APPLE" | "BOTH" | "LATER";
  termId: string;
  cohortSectionId?: string;
  enrollments?: {
    courseId: string;
    courseSectionCode?: "A" | "B" | "C";
  }[];
}

export class CompleteOnboardingError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CompleteOnboardingError";
    this.status = status;
  }
}

export async function completeOnboarding(input: CompleteOnboardingInput) {
  const term = await db.term.findFirst({
    where: { id: input.termId, batchId: input.sessionBatchId ?? undefined },
    include: {
      batch: { include: { program: true } },
      _count: { select: { courses: true } },
    },
  });
  if (!term) {
    throw new CompleteOnboardingError("Invalid term.", 400);
  }

  const availability = resolveTermAvailability(
    term.batch.label,
    term.number,
    term._count.courses > 0,
  );
  if (availability !== "live") {
    throw new CompleteOnboardingError(voice.onboarding.pickLiveTerm, 400);
  }

  const elective = isElectiveTerm(term.number);
  const needsSection = termRequiresCohortSection(term.batch.program.kind, term.number);
  if (needsSection && !input.cohortSectionId) {
    throw new CompleteOnboardingError("Pick your section (A–H).", 400);
  }
  if (elective && (!input.enrollments || input.enrollments.length === 0)) {
    throw new CompleteOnboardingError("Select at least one course.", 400);
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.sessionId },
      data: {
        name: input.name.trim(),
        rollNumber: input.rollNumber?.trim() || null,
        calendarPreference: input.calendarPreference ?? "LATER",
        activeTermId: input.termId,
        onboardingCompletedAt: new Date(),
      },
    });

    if (!elective) {
      await tx.userTermProfile.upsert({
        where: {
          userId_termId: { userId: input.sessionId, termId: input.termId },
        },
        create: {
          userId: input.sessionId,
          termId: input.termId,
          cohortSectionId: input.cohortSectionId ?? null,
        },
        update: {
          cohortSectionId: input.cohortSectionId ?? null,
        },
      });
      return;
    }

    const enrollments = input.enrollments ?? [];
    await tx.enrollment.deleteMany({
      where: { userId: input.sessionId, termId: input.termId },
    });

    for (const enrollment of enrollments) {
      const course = await tx.course.findFirst({
        where: { id: enrollment.courseId, termId: input.termId },
        include: { sections: true },
      });
      if (!course) continue;

      let sectionId: string | null = null;
      if (enrollment.courseSectionCode) {
        sectionId =
          course.sections.find((s) => s.code === enrollment.courseSectionCode)?.id ??
          null;
      } else if (course.sections.length === 1) {
        sectionId = course.sections[0].id;
      }

      await tx.enrollment.create({
        data: {
          userId: input.sessionId,
          termId: input.termId,
          courseId: course.id,
          courseSectionId: sectionId,
        },
      });
    }
  });
}
