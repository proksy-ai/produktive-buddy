import { describe, expect, it } from "vitest";

import { buildCalendar, escapeIcsText, toUtcStamp } from "@/lib/ics";
import type { ClassSession } from "@/lib/schedule";

describe("ICS helpers", () => {
  it("converts campus IST time to UTC iCal timestamps", () => {
    expect(toUtcStamp("2026-06-09", "09:15")).toBe("20260609T034500Z");
  });

  it("escapes reserved iCal characters", () => {
    expect(escapeIcsText("A, B; C\\D\nE")).toBe("A\\, B\\; C\\\\D\\nE");
  });

  it("marks cancelled classes as cancelled events", () => {
    const session: ClassSession = {
      id: "s1",
      courseId: "c1",
      colorKey: "indigo",
      date: "2026-06-09",
      startTime: "09:15",
      endTime: "10:30",
      courseAbbr: "GT",
      courseName: "Game Theory",
      credits: 3,
      expectedSessionsOverride: null,
      faculty: "Prof. A",
      room: "CR A1",
      sectionCode: null,
      status: "CANCELLED",
      kind: "CLASS",
    };
    const calendar = buildCalendar([session], "Produktive Buddy");
    expect(calendar).toContain("STATUS:CANCELLED");
    expect(calendar).toContain("SUMMARY:Cancelled: GT · Game Theory");
  });
});
