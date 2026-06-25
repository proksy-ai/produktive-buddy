import {
  COURSE_COLOR_KEYS,
  type CourseColorKey,
} from "@/lib/colors";
import { db } from "@/lib/db";

export type CourseColorMap = Map<string, CourseColorKey>;

function isCourseColorKey(value: string): value is CourseColorKey {
  return COURSE_COLOR_KEYS.includes(value as CourseColorKey);
}

export function assignCourseColorKeys(
  courseIds: string[],
  used: Iterable<CourseColorKey> = [],
): Map<string, CourseColorKey> {
  const usedSet = new Set(used);
  const available = COURSE_COLOR_KEYS.filter((key) => !usedSet.has(key));
  const unique = [...new Set(courseIds)].sort();
  const map = new Map<string, CourseColorKey>();
  for (let i = 0; i < unique.length; i++) {
    map.set(unique[i], available[i] ?? COURSE_COLOR_KEYS[i % COURSE_COLOR_KEYS.length]);
  }
  return map;
}

export async function ensureCourseColorPreferences(
  userId: string,
  termId: string,
  courseIds: string[],
): Promise<CourseColorMap> {
  const uniqueCourseIds = [...new Set(courseIds)];
  if (uniqueCourseIds.length === 0) return new Map();

  const existing = await db.userCoursePreference.findMany({
    where: { userId, termId, courseId: { in: uniqueCourseIds } },
    select: { courseId: true, colorKey: true },
  });

  const map: CourseColorMap = new Map();
  const used = new Set<CourseColorKey>();
  for (const pref of existing) {
    if (isCourseColorKey(pref.colorKey)) {
      map.set(pref.courseId, pref.colorKey);
      used.add(pref.colorKey);
    }
  }

  const missing = uniqueCourseIds
    .filter((id) => !map.has(id))
    .sort();
  const assigned = assignCourseColorKeys(missing, used);

  // Local-first policy: avoid write-on-read side effects. Persist only when
  // explicit user actions introduce color customization workflows.
  for (const [courseId, colorKey] of assigned) map.set(courseId, colorKey);

  return map;
}
