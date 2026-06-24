import type { Prisma, SessionStatus } from "@prisma/client";

import {
  ensureCourseColorPreferences,
  type CourseColorMap,
} from "@/lib/course-preferences";
import { db } from "@/lib/db";
import { isElectiveTerm } from "@/lib/onboarding";

export interface ClassSession {
  id: string;
  courseId: string;
  colorKey: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "09:15"
  endTime: string; // "10:30"
  courseAbbr: string;
  courseName: string;
  credits: number | null;
  expectedSessionsOverride: number | null;
  faculty: string | null;
  room: string | null;
  sectionCode: string | null;
  status: SessionStatus;
}

export interface EnrolledCourse {
  id: string;
  abbr: string;
  name: string;
  faculty: string | null;
  credits: number | null;
  sectionCode: string | null;
  colorKey: string;
}

export interface ActiveTermContext {
  termId: string;
  termName: string;
  termNumber: number;
  programName: string;
  batchLabel: string;
  isElective: boolean;
  cohortSectionCode: string | null;
  courses: EnrolledCourse[];
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function colorMapForCourses(
  userId: string,
  termId: string,
  courseIds: string[],
): Promise<CourseColorMap> {
  return ensureCourseColorPreferences(userId, termId, courseIds);
}

const CAMPUS_TZ = "Asia/Kolkata";
const TERM_NAMES = ["I", "II", "III", "IV", "V", "VI"];

/** Current date/time on campus (IST), independent of the server's timezone. */
export function campusNow(): { ymd: string; hm: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMPUS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    hm: `${get("hour")}:${get("minute")}`,
  };
}

/** Parse a campus date string at UTC midnight, matching how sessions are stored. */
export function campusDateUTC(ymdStr: string): Date {
  const [y, m, d] = ymdStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Loads the user's active term and what personalizes their schedule:
 * enrolled courses (electives) or a cohort section (year-1 PGP).
 */
export async function getActiveTermContext(
  userId: string,
): Promise<ActiveTermContext | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      activeTermId: true,
      batch: { include: { program: true } },
      enrollments: {
        include: {
          course: true,
          courseSection: true,
        },
      },
      termProfiles: {
        include: { cohortSection: true },
      },
    },
  });

  if (!user?.activeTermId || !user.batch) return null;

  const term = await db.term.findUnique({
    where: { id: user.activeTermId },
  });
  if (!term) return null;

  const elective = isElectiveTerm(term.number);
  const profile = user.termProfiles.find((p) => p.termId === term.id);

  const rawCourses = user.enrollments
    .filter((e) => e.termId === term.id)
    .map((e) => ({
      id: e.course.id,
      abbr: e.course.abbr,
      name: e.course.name,
      faculty: e.course.faculty,
      credits: e.course.credits,
      sectionCode: e.courseSection?.code ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const colors = await colorMapForCourses(
    userId,
    term.id,
    rawCourses.map((c) => c.id),
  );

  const courses: EnrolledCourse[] = rawCourses.map((c) => ({
    ...c,
    colorKey: colors.get(c.id) ?? c.abbr,
  }));

  return {
    termId: term.id,
    termName: term.name || `Term ${TERM_NAMES[term.number - 1] ?? term.number}`,
    termNumber: term.number,
    programName: user.batch.program.name,
    batchLabel: user.batch.label,
    isElective: elective,
    cohortSectionCode: profile?.cohortSection?.code ?? null,
    courses,
  };
}

/**
 * Personalized sessions for the user's active term, optionally bounded by date.
 * - Electives: sessions for the user's enrolled courses.
 * - PGP year-1: sessions for the user's cohort section (A–H).
 * - FIN/LSM year-1: all sessions for the term (no sections).
 */
export async function getUserSessions(
  userId: string,
  opts: { from?: Date; to?: Date } = {},
): Promise<ClassSession[]> {
  const ctx = await getActiveTermContext(userId);
  if (!ctx) return [];

  const where: Prisma.SessionWhereInput = { termId: ctx.termId };

  if (opts.from || opts.to) {
    where.date = {
      ...(opts.from ? { gte: opts.from } : {}),
      ...(opts.to ? { lte: opts.to } : {}),
    };
  }

  if (ctx.isElective) {
    const courseIds = ctx.courses.map((c) => c.id);
    if (courseIds.length === 0) return [];
    where.courseId = { in: courseIds };
  } else if (ctx.cohortSectionCode) {
    const cohort = await db.cohortSection.findFirst({
      where: { termId: ctx.termId, code: ctx.cohortSectionCode },
      select: { id: true },
    });
    if (cohort) where.cohortSectionId = cohort.id;
  }

  const sessions = await db.session.findMany({
    where,
    include: { course: true, courseSection: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const colors = await colorMapForCourses(
    userId,
    ctx.termId,
    [...new Set(sessions.map((s) => s.courseId))],
  );

  return sessions.map((s) => ({
    id: s.id,
    courseId: s.courseId,
    colorKey: colors.get(s.courseId) ?? s.course.abbr,
    date: ymd(s.date),
    startTime: s.startTime,
    endTime: s.endTime,
    courseAbbr: s.course.abbr,
    courseName: s.course.name,
    credits: s.course.credits,
    expectedSessionsOverride: s.course.expectedSessionsOverride,
    faculty: s.course.faculty,
    room: s.room,
    sectionCode: s.courseSection?.code ?? null,
    status: s.status,
  }));
}

/** Group sessions by their date string, preserving chronological order. */
export function groupByDate(
  sessions: ClassSession[],
): { date: string; sessions: ClassSession[] }[] {
  const map = new Map<string, ClassSession[]>();
  for (const s of sessions) {
    const list = map.get(s.date) ?? [];
    list.push(s);
    map.set(s.date, list);
  }
  return [...map.entries()].map(([date, list]) => ({ date, sessions: list }));
}

/**
 * The next class the user should care about: the earliest non-cancelled session
 * that hasn't ended yet, scanning from "now" forward.
 */
export function findNextSession(
  sessions: ClassSession[],
  now: { ymd: string; hm: string },
): ClassSession | null {
  for (const s of sessions) {
    if (s.status === "CANCELLED") continue;
    if (s.date > now.ymd) return s;
    if (s.date === now.ymd && s.endTime > now.hm) return s;
  }
  return null;
}
