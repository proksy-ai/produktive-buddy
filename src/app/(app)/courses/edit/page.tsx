import { redirect } from "next/navigation";

import {
  CoursePicker,
  type CoursePickerItem,
} from "@/components/app/course-picker";
import { PageHeader } from "@/components/app/page-header";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getActiveTermContext } from "@/lib/schedule";

function groupForCourse(course: {
  programCode: string | null;
  abbr: string;
  faculty: string | null;
}) {
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
      orderBy: [{ programCode: "asc" }, { name: "asc" }],
      select: {
        id: true,
        abbr: true,
        name: true,
        faculty: true,
        credits: true,
        programCode: true,
      },
    }),
    db.enrollment.findMany({
      where: { userId: session.id, termId: ctx.termId },
      select: { courseId: true },
    }),
  ]);

  const items: CoursePickerItem[] = courses.map((c) => ({
    id: c.id,
    abbr: c.abbr,
    name: c.name,
    faculty: c.faculty,
    credits: c.credits,
    group: groupForCourse(c),
  }));

  return (
    <div>
      <PageHeader
        title="Edit courses"
        subtitle={`${ctx.termName} · Search, pick, save. No drama.`}
      />
      <CoursePicker
        courses={items}
        initialSelected={enrollments.map((e) => e.courseId)}
      />
    </div>
  );
}
