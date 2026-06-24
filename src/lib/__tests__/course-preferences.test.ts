import { describe, expect, it } from "vitest";

import { COURSE_COLOR_KEYS } from "@/lib/colors";
import { assignCourseColorKeys } from "@/lib/course-preferences";

describe("assignCourseColorKeys", () => {
  it("assigns distinct colors for a normal 6-8 course workload", () => {
    const courses = ["GT", "GBS", "NCM", "IAPM", "SOMA", "GC", "FC", "ILM"];
    const colors = [...assignCourseColorKeys(courses).values()];
    expect(new Set(colors).size).toBe(courses.length);
  });

  it("skips colors already used by existing preferences", () => {
    const assigned = assignCourseColorKeys(["A", "B"], ["indigo", "sky"]);
    expect([...assigned.values()]).toEqual([
      COURSE_COLOR_KEYS[2],
      COURSE_COLOR_KEYS[3],
    ]);
  });
});
