import { describe, expect, it } from "vitest";

import { parseCourseDetails, parseScheduleGrid } from "@/lib/sheets/parse";

describe("sheet parsing", () => {
  it("parses course details with carried program codes", () => {
    const rows = [
      ["Programme", "Course", "Abbr", "Sections", "Credits", "Faculty"],
      ["PGP 29", "Game Theory", "GT", "A/B", "3", "Prof. A"],
      ["", "Global Strategy", "GBS", "A", "2", "Prof. B"],
    ];
    expect(parseCourseDetails(rows)).toMatchObject([
      { abbr: "GT", name: "Game Theory", programCode: "PGP 29", credits: 3 },
      { abbr: "GBS", name: "Global Strategy", programCode: "PGP 29", credits: 2 },
    ]);
  });

  it("parses schedule cells with status map", () => {
    const sessions = parseScheduleGrid(
      [
        ["Date", "Time", "CR A1 Sec A"],
        ["June 9, 2026", "09.15 - 10.30", "GT-A"],
      ],
      new Map([["1:2", "CANCELLED"]]),
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      startTime: "09:15",
      endTime: "10:30",
      courseAbbr: "GT",
      courseSectionCode: "A",
      cohortSectionCode: "A",
      status: "CANCELLED",
    });
  });
});
