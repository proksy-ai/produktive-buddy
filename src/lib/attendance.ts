import { db } from "@/lib/db";
import { attendancePolicy } from "@/features/attendance/policy";
import {
  campusNow,
  getActiveTermContext,
  getUserSessions,
  type ClassSession,
} from "@/lib/schedule";

export type AttendanceMark = "PRESENT" | "ABSENT";

export interface CourseAttendance {
  courseId: string;
  abbr: string;
  name: string;
  credits: number | null;
  total: number; // expected classes per policy, not merely imported sheet rows
  scheduled: number; // all non-cancelled sessions currently imported
  held: number; // non-cancelled sessions that already happened
  absent: number; // marked ABSENT
  attended: number; // held - absent (present by default)
  percent: number; // attended / held (0 if none held yet)
  requiredClasses: number; // ceil(expected classes * 0.8)
  allowedAbsences: number; // expectedClasses - requiredClasses
  bunksLeft: number; // allowedAbsences - absent
}

export interface AttendanceOverview {
  overall: CourseAttendance;
  byCourse: CourseAttendance[];
  /** Map of sessionId -> mark, for rendering quick toggles. */
  marks: Record<string, AttendanceMark>;
}

function isPast(s: ClassSession, now: { ymd: string; hm: string }): boolean {
  return s.date < now.ymd || (s.date === now.ymd && s.endTime <= now.hm);
}

function summarize(
  courseId: string,
  abbr: string,
  name: string,
  sessions: ClassSession[],
  marks: Record<string, AttendanceMark>,
  now: { ymd: string; hm: string },
): CourseAttendance {
  const active = sessions.filter((s) => s.status !== "CANCELLED");
  const sample = active[0] ?? sessions[0];
  const credits = sample?.credits ?? null;
  const policy = attendancePolicy({
    credits,
    scheduledSessions: active.length,
    expectedSessionsOverride: sample?.expectedSessionsOverride,
  });
  const held = active.filter((s) => isPast(s, now)).length;
  const absent = active.filter(
    (s) => isPast(s, now) && marks[s.id] === "ABSENT",
  ).length;
  const attended = held - absent;
  const percent = held === 0 ? 100 : Math.round((attended / held) * 100);

  return {
    courseId,
    abbr,
    name,
    credits,
    total: policy.expectedClasses,
    scheduled: active.length,
    held,
    absent,
    attended,
    percent,
    requiredClasses: policy.requiredClasses,
    allowedAbsences: policy.allowedAbsences,
    bunksLeft: policy.allowedAbsences - absent,
  };
}

export async function getAttendanceOverview(
  userId: string,
): Promise<AttendanceOverview | null> {
  const ctx = await getActiveTermContext(userId);
  if (!ctx) return null;

  const sessions = await getUserSessions(userId);
  const now = campusNow();

  const records = await db.attendance.findMany({
    where: {
      userId,
      session: { id: { in: sessions.map((s) => s.id) } },
    },
    select: { sessionId: true, status: true },
  });

  const marks: Record<string, AttendanceMark> = {};
  for (const r of records) {
    if (r.status === "PRESENT" || r.status === "ABSENT") {
      marks[r.sessionId] = r.status;
    }
  }

  const byCourseMap = new Map<string, ClassSession[]>();
  for (const s of sessions) {
    const list = byCourseMap.get(s.courseId) ?? [];
    list.push(s);
    byCourseMap.set(s.courseId, list);
  }

  const byCourse = [...byCourseMap.entries()]
    .map(([courseId, list]) =>
      summarize(
        courseId,
        list[0].courseAbbr,
        list[0].courseName,
        list,
        marks,
        now,
      ),
    )
    .sort((a, b) => a.percent - b.percent);

  const overallHeld = byCourse.reduce((sum, c) => sum + c.held, 0);
  const overallAttended = byCourse.reduce((sum, c) => sum + c.attended, 0);
  const overallAbsent = byCourse.reduce((sum, c) => sum + c.absent, 0);
  const overallAllowedAbsences = byCourse.reduce(
    (sum, c) => sum + c.allowedAbsences,
    0,
  );
  const overall: CourseAttendance = {
    courseId: "__all__",
    abbr: "ALL",
    name: "Overall",
    credits: byCourse.reduce((sum, c) => sum + (c.credits ?? 0), 0),
    total: byCourse.reduce((sum, c) => sum + c.total, 0),
    scheduled: byCourse.reduce((sum, c) => sum + c.scheduled, 0),
    held: overallHeld,
    absent: overallAbsent,
    attended: overallAttended,
    percent:
      overallHeld === 0
        ? 100
        : Math.round((overallAttended / overallHeld) * 100),
    requiredClasses: byCourse.reduce((sum, c) => sum + c.requiredClasses, 0),
    allowedAbsences: overallAllowedAbsences,
    bunksLeft: overallAllowedAbsences - overallAbsent,
  };

  return { overall, byCourse, marks };
}
