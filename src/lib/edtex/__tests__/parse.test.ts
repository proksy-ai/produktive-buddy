import { describe, expect, it } from "vitest";

import { matchEdtexToCatalog, parseEdtexText } from "@/lib/edtex/parse";

describe("EDTEX parsing", () => {
  it("extracts A/B/C section from uploaded course codes", () => {
    const parsed = parseEdtexText(
      "1 Global Business Strategy - PG2GBS(B) (Prof. A)",
    );

    expect(parsed).toMatchObject([
      {
        name: "Global Business Strategy",
        code: "PG2GBS(B)",
        sectionCode: "B",
      },
    ]);
  });

  it("applies detected section to the matched catalog course", () => {
    const parsed = parseEdtexText(
      "1 Global Business Strategy - PG2GBS(C) (Prof. A)",
    );

    const result = matchEdtexToCatalog(parsed, [
      {
        id: "course-1",
        abbr: "GBS",
        name: "Global Business Strategy",
        faculty: "Prof. A",
        sections: [{ code: "A" }, { code: "B" }, { code: "C" }],
      },
    ]);

    expect(result.matched).toMatchObject([
      {
        courseId: "course-1",
        detectedSection: "C",
        needsSectionPick: false,
      },
    ]);
  });
});
