import { NextResponse } from "next/server";
import { z } from "zod";

import { isElectiveTerm, termRequiresCohortSection } from "@/lib/onboarding";
import {
  createSessionToken,
  requireSession,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { db } from "@/lib/db";
import { resolveTermAvailability } from "@/lib/terms";
import { voice } from "@/lib/voice";
import { assertSameOrigin } from "@/server/security/csrf";

const enrollmentSchema = z.object({
  courseId: z.string(),
  courseSectionCode: z.enum(["A", "B", "C"]).optional(),
});

const bodySchema = z.object({
  name: z.string().min(2).max(80),
  rollNumber: z.string().max(32).optional(),
  calendarPreference: z.enum(["GOOGLE", "APPLE", "BOTH", "LATER"]).optional(),
  termId: z.string(),
  cohortSectionId: z.string().optional(),
  enrollments: z.array(enrollmentSchema).optional(),
});

export async function POST(request: Request) {
  try {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;
    const session = await requireSession();
    const body = bodySchema.parse(await request.json());

    const term = await db.term.findFirst({
      where: { id: body.termId, batchId: session.batchId ?? undefined },
      include: {
        batch: { include: { program: true } },
        _count: { select: { courses: true } },
      },
    });
    if (!term) {
      return NextResponse.json({ error: "Invalid term." }, { status: 400 });
    }

    const availability = resolveTermAvailability(
      term.batch.label,
      term.number,
      term._count.courses > 0,
    );
    if (availability !== "live") {
      return NextResponse.json(
        { error: voice.onboarding.pickLiveTerm },
        { status: 400 },
      );
    }

    const elective = isElectiveTerm(term.number);
    const needsSection = termRequiresCohortSection(
      term.batch.program.kind,
      term.number,
    );

    if (needsSection && !body.cohortSectionId) {
      return NextResponse.json(
        { error: "Pick your section (A–H)." },
        { status: 400 },
      );
    }

    if (elective && (!body.enrollments || body.enrollments.length === 0)) {
      return NextResponse.json(
        { error: "Select at least one course." },
        { status: 400 },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.id },
        data: {
          name: body.name.trim(),
          rollNumber: body.rollNumber?.trim() || null,
          calendarPreference: body.calendarPreference ?? "LATER",
          activeTermId: body.termId,
          onboardingCompletedAt: new Date(),
        },
      });

      if (!elective) {
        await tx.userTermProfile.upsert({
          where: {
            userId_termId: { userId: session.id, termId: body.termId },
          },
          create: {
            userId: session.id,
            termId: body.termId,
            cohortSectionId: body.cohortSectionId ?? null,
          },
          update: {
            cohortSectionId: body.cohortSectionId ?? null,
          },
        });
      }

      if (elective && body.enrollments) {
        await tx.enrollment.deleteMany({
          where: { userId: session.id, termId: body.termId },
        });

        for (const en of body.enrollments) {
          const course = await tx.course.findFirst({
            where: { id: en.courseId, termId: body.termId },
            include: { sections: true },
          });
          if (!course) continue;

          let sectionId: string | null = null;
          if (en.courseSectionCode) {
            sectionId =
              course.sections.find((s) => s.code === en.courseSectionCode)
                ?.id ?? null;
          } else if (course.sections.length === 1) {
            sectionId = course.sections[0].id;
          }

          await tx.enrollment.create({
            data: {
              userId: session.id,
              termId: body.termId,
              courseId: course.id,
              courseSectionId: sectionId,
            },
          });
        }
      }
    });

    const user = await db.user.findUniqueOrThrow({
      where: { id: session.id },
      include: { batch: true },
    });

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      batchId: user.batchId,
      batchLabel: user.batch?.label ?? null,
      role: user.role,
    });

    const response = NextResponse.json({
      ok: true,
      user: { name: user.name, batchLabel: user.batch?.label },
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("[onboarding/complete]", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
