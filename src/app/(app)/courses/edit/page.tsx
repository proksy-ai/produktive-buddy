import { redirect } from "next/navigation";

import {
  CoursePicker,
  type CoursePickerItem,
} from "@/components/app/course-picker";
import { PageHeader } from "@/components/app/page-header";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getActiveTermContext } from "@/lib/schedule";

function areaForCourse(course: {
  area: string | null;
  programCode: string | null;
  abbr: string;
}) {
  if (course.area?.trim()) return course.area.trim();
  if (course.programCode?.trim()) return course.programCode.trim();
  const prefix = course.abbr.split(/[ -]/)[0]?.trim();
  return prefix || "Electives";
}

export default async function EditCoursesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const ctx = await getActiveTermContext(session.id);
  if (!ctx) redirect("/onboarding");

  const [courses, enrollments] = await Promise.all([
    db.course.findMany({
      where: { termId: ctx.termId },
      orderBy: [{ area: "asc" }, { name: "asc" }],
      select: {
        id: true,
        abbr: true,
        name: true,
        faculty: true,
        credits: true,
        programCode: true,
        area: true,
        sections: {
          orderBy: { code: "asc" },
          select: {
            code: true,
            timings: true,
            professor: true,
            totalSeats: true,
            remainingSeats: true,
          },
        },
      },
    }),
    db.enrollment.findMany({
      where: { userId: session.id, termId: ctx.termId },
      select: { courseId: true, courseSection: { select: { code: true } } },
    }),
  ]);

  const items: CoursePickerItem[] = courses.map((c) => ({
    id: c.id,
    abbr: c.abbr,
    name: c.name,
    faculty: c.faculty,
    credits: c.credits,
    group: areaForCourse(c),
    sections:
      c.sections.length > 0
        ? c.sections.map((s) => ({
            code: s.code,
            timings: s.timings,
            professor: s.professor,
            totalSeats: s.totalSeats,
            remainingSeats: s.remainingSeats,
          }))
        : [
            {
              code: "A",
              timings: null,
              professor: c.faculty,
              totalSeats: null,
              remainingSeats: 1,
            },
          ],
  }));

  const initialSelected = enrollments.map((e) => ({
    courseId: e.courseId,
    sectionCode: e.courseSection?.code ?? "A",
  }));

  return (
    <div>
      <PageHeader
        title="Pick courses"
        subtitle={`${ctx.termName} · grouped by area, clashes flagged live`}
      />
      <CoursePicker courses={items} initialSelected={initialSelected} />
    </div>
  );
}
