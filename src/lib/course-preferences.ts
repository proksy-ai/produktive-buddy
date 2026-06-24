import {
  COURSE_COLOR_KEYS,
  type CourseColorKey,
} from "@/lib/colors";
import { db } from "@/lib/db";

export type CourseColorMap = Map<string, CourseColorKey>;

function isCourseColorKey(value: string): value is CourseColorKey {
  return COURSE_COLOR_KEYS.includes(value as CourseColorKey);
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

  const available = COURSE_COLOR_KEYS.filter((key) => !used.has(key));
  const missing = uniqueCourseIds
    .filter((id) => !map.has(id))
    .sort();

  for (let i = 0; i < missing.length; i++) {
    const colorKey =
      available[i] ?? COURSE_COLOR_KEYS[i % COURSE_COLOR_KEYS.length];
    const courseId = missing[i];
    await db.userCoursePreference.upsert({
      where: { userId_termId_courseId: { userId, termId, courseId } },
      create: { userId, termId, courseId, colorKey },
      update: { colorKey },
    });
    map.set(courseId, colorKey);
  }

  return map;
}
