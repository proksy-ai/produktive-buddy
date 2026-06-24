import { ProgressRing } from "@/components/ui/progress-ring";
import type { CourseAttendance } from "@/lib/attendance";
import { courseAccent } from "@/lib/colors";
import { voice } from "@/lib/voice";

function ringColor(percent: number): string {
  if (percent >= 85) return "var(--color-success)";
  if (percent >= 80) return "var(--color-warning)";
  return "var(--color-destructive)";
}

function phrase(percent: number): string {
  if (percent >= 85) return voice.attendance.safe;
  if (percent >= 80) return voice.attendance.warning;
  return voice.attendance.danger;
}

export function AttendanceSummaryCard({
  overall,
}: {
  overall: CourseAttendance;
}) {
  if (overall.held === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <ProgressRing
        value={overall.percent}
        color={ringColor(overall.percent)}
        size={76}
        label={`${overall.percent}%`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{voice.attendance.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {phrase(overall.percent)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{voice.attendance.held(overall.attended, overall.held)}</span>
          <span className="font-medium text-foreground">
            {voice.attendance.bunksLeft(overall.bunksLeft)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SubjectAttendancePulse({
  courses,
}: {
  courses: CourseAttendance[];
}) {
  const active = courses
    .filter((c) => c.held > 0)
    .sort((a, b) => a.bunksLeft - b.bunksLeft || a.percent - b.percent);
  const focus = active[0];

  if (!focus) return null;

  const risky = focus.bunksLeft <= 1 || focus.percent < 85;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Subject attendance
          </p>
          <p className="mt-1 truncate text-sm font-semibold">{focus.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {risky
              ? "This is the one to protect. Grade drops happen subject-wise."
              : "All calm for now. Chef's kiss, but keep showing up."}
          </p>
        </div>
        <ProgressRing
          value={focus.percent}
          color={ringColor(focus.percent)}
          size={60}
          strokeWidth={6}
          label={`${focus.percent}%`}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{voice.attendance.held(focus.attended, focus.held)}</span>
        <span className="font-medium text-foreground">
          {voice.attendance.bunksLeft(focus.bunksLeft)}
        </span>
      </div>
    </div>
  );
}

export function CourseAttendanceList({
  courses,
}: {
  courses: CourseAttendance[];
}) {
  return (
    <div className="grid gap-3">
      {courses.map((c) => {
        const accent = courseAccent(c.abbr);
        return (
          <div
            key={c.courseId}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <ProgressRing
              value={c.percent}
              color={c.held === 0 ? "var(--color-muted-foreground)" : ringColor(c.percent)}
              size={56}
              strokeWidth={6}
              label={c.held === 0 ? "—" : `${c.percent}%`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span
                  className="rounded px-1.5 py-0.5 font-medium"
                  style={{
                    color: accent,
                    background: `color-mix(in oklch, ${accent} 14%, transparent)`,
                  }}
                >
                  {c.abbr}
                </span>
                {c.held > 0 ? (
                  <span>{voice.attendance.held(c.attended, c.held)}</span>
                ) : (
                  <span>Not started</span>
                )}
              </div>
            </div>
            <span className="shrink-0 text-right text-xs font-medium text-muted-foreground">
              {voice.attendance.bunksLeft(c.bunksLeft)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
