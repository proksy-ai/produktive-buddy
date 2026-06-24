import { describe, expect, it } from "vitest";

import { compareSlotsForDate } from "@/features/social/free-busy";
import type { ClassSession } from "@/lib/schedule";

function session(overrides: Partial<ClassSession>): ClassSession {
  return {
    id: "s",
    courseId: "c",
    colorKey: "indigo",
    date: "2026-06-24",
    startTime: "09:00",
    endTime: "10:00",
    courseAbbr: "GT",
    courseName: "Game Theory",
    credits: 3,
    expectedSessionsOverride: null,
    faculty: null,
    room: null,
    sectionCode: null,
    status: "SCHEDULED",
    ...overrides,
  };
}

describe("compareSlotsForDate", () => {
  it("labels busy/free states across overlapping schedules", () => {
    const slots = compareSlotsForDate(
      [session({ startTime: "09:00", endTime: "10:00", courseAbbr: "GT" })],
      [session({ startTime: "10:00", endTime: "11:00", courseAbbr: "GBS" })],
      "2026-06-24",
    );
    expect(slots.map((s) => s.state)).toEqual(["you_busy", "friend_busy"]);
  });

  it("ignores cancelled classes", () => {
    const slots = compareSlotsForDate(
      [session({ status: "CANCELLED" })],
      [session({ status: "CANCELLED" })],
      "2026-06-24",
    );
    expect(slots).toEqual([]);
  });
});
