import { describe, expect, it } from "vitest";

import { attendancePolicy } from "@/features/attendance/policy";

describe("attendancePolicy", () => {
  it("uses the IIMK 80 percent policy for a 3 credit course", () => {
    expect(attendancePolicy({ credits: 3, scheduledSessions: 0 })).toEqual({
      expectedClasses: 24,
      requiredClasses: 19,
      allowedAbsences: 5,
    });
  });

  it("uses the IIMK 80 percent policy for a 2 credit course", () => {
    expect(attendancePolicy({ credits: 2, scheduledSessions: 0 })).toEqual({
      expectedClasses: 16,
      requiredClasses: 13,
      allowedAbsences: 3,
    });
  });

  it("honors an explicit expected session override", () => {
    expect(
      attendancePolicy({
        credits: 3,
        scheduledSessions: 10,
        expectedSessionsOverride: 21,
      }),
    ).toEqual({
      expectedClasses: 21,
      requiredClasses: 17,
      allowedAbsences: 4,
    });
  });
});
