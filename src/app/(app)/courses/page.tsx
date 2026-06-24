import { BookOpen, GraduationCap, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AttendanceSummaryCard } from "@/components/app/attendance-card";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { getAttendanceOverview } from "@/lib/attendance";
import { getSession } from "@/lib/auth/session";
import { courseAccent } from "@/lib/colors";
import { getActiveTermContext } from "@/lib/schedule";
import { voice } from "@/lib/voice";

export const metadata: Metadata = { title: "Courses" };

function ringColor(percent: number, held: number): string {
  if (held === 0) return "var(--color-muted-foreground)";
  if (percent >= 85) return "var(--color-success)";
  if (percent >= 80) return "var(--color-warning)";
  return "var(--color-destructive)";
}

export default async function CoursesPage() {
  const session = await getSession();
  const ctx = session ? await getActiveTermContext(session.id) : null;

  if (!ctx || ctx.courses.length === 0) {
    return (
      <div>
        <PageHeader title="Courses" subtitle={voice.courses.subtitle} />
        <EmptyState
          icon={BookOpen}
          title={voice.courses.emptyTitle}
          description={voice.courses.emptyBody}
          action={
            <Button asChild>
              <Link href="/onboarding">{voice.today.addCourses}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const attendance = await getAttendanceOverview(session!.id);
  const attByCourse = new Map(
    (attendance?.byCourse ?? []).map((c) => [c.courseId, c]),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Courses"
        subtitle={`${ctx.programName} · ${ctx.termName}`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/courses/edit">Edit</Link>
          </Button>
        }
      />

      {attendance?.overall && attendance.overall.held > 0 ? (
        <AttendanceSummaryCard overall={attendance.overall} />
      ) : null}

      <div className="grid gap-3">
        {ctx.courses.map((c) => {
          const accent = courseAccent(c.colorKey);
          const att = attByCourse.get(c.id);
          return (
            <div
              key={c.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{
                  color: accent,
                  background: `color-mix(in oklch, ${accent} 16%, transparent)`,
                }}
              >
                {c.abbr.slice(0, 2).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{c.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{c.abbr}</span>
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3" />
                    {c.faculty ?? voice.courses.facultyTbd}
                  </span>
                  {c.credits ? (
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="size-3" />
                      {voice.courses.creditsLabel(c.credits)}
                    </span>
                  ) : null}
                  {c.sectionCode ? (
                    <span>{voice.courses.sectionLabel(c.sectionCode)}</span>
                  ) : null}
                </div>
                {att && att.held > 0 ? (
                  <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                    {voice.attendance.bunksLeft(att.bunksLeft)}
                  </p>
                ) : null}
              </div>

              {att ? (
                <ProgressRing
                  value={att.percent}
                  color={ringColor(att.percent, att.held)}
                  size={48}
                  strokeWidth={5}
                  label={att.held === 0 ? "—" : `${att.percent}%`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
