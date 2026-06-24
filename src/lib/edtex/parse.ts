export interface ParsedEdtexCourse {
  code: string;
  name: string;
  professor: string | null;
  sectionCode: "A" | "B" | "C" | null;
}

const COURSE_LINE =
  /^\s*\d+\s+(.+?)\s-\s(PG2[A-Z0-9-]+(?:\([A-Z]\))?)\s*(?:\((Prof\.\s[^)]+)\))?/i;
const SECTION_RE = /\(([ABC])\)$/i;

/** Parse confirmed-courses text extracted from an EDTEX PDF. */
export function parseEdtexText(text: string): ParsedEdtexCourse[] {
  const courses: ParsedEdtexCourse[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    const m = line.match(COURSE_LINE);
    if (!m) continue;

    const name = m[1].trim();
    const code = m[2].trim().toUpperCase();
    if (seen.has(code)) continue;
    seen.add(code);

    courses.push({
      name,
      code,
      professor: m[3]?.trim() ?? null,
      sectionCode: extractSectionCode(code),
    });
  }

  return courses;
}

function extractSectionCode(code: string): "A" | "B" | "C" | null {
  const section = code.match(SECTION_RE)?.[1]?.toUpperCase();
  return section === "A" || section === "B" || section === "C" ? section : null;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface CourseMatch {
  edtexCode: string;
  edtexName: string;
  courseId: string;
  courseAbbr: string;
  courseName: string;
  sections: string[];
  detectedSection: "A" | "B" | "C" | null;
  needsSectionPick: boolean;
}

/** Match EDTEX course names to courses in a term's catalog. */
export function matchEdtexToCatalog(
  parsed: ParsedEdtexCourse[],
  catalog: {
    id: string;
    abbr: string;
    name: string;
    faculty: string | null;
    sections: { code: string }[];
  }[],
): { matched: CourseMatch[]; unmatched: ParsedEdtexCourse[] } {
  const matched: CourseMatch[] = [];
  const unmatched: ParsedEdtexCourse[] = [];

  for (const item of parsed) {
    const normName = normalize(item.name);
    const normProf = item.professor ? normalize(item.professor) : null;

    let best: (typeof catalog)[number] | null = null;
    let bestScore = 0;

    for (const course of catalog) {
      const cn = normalize(course.name);
      let score = 0;
      if (cn === normName) score += 100;
      else if (cn.includes(normName) || normName.includes(cn)) score += 60;
      else {
        const words = normName.split(" ").filter((w) => w.length > 3);
        const hits = words.filter((w) => cn.includes(w)).length;
        score += hits * 12;
      }
      if (normProf && course.faculty && normalize(course.faculty).includes(normProf.replace("prof ", ""))) {
        score += 20;
      }
      if (score > bestScore) {
        bestScore = score;
        best = course;
      }
    }

    if (!best || bestScore < 24) {
      unmatched.push(item);
      continue;
    }

    const sections = best.sections
      .map((s) => s.code)
      .filter((code) => code === "A" || code === "B" || code === "C");
    const detectedSection = item.sectionCode
      ? sections.find((code) => code === item.sectionCode) ?? null
      : null;
    matched.push({
      edtexCode: item.code,
      edtexName: item.name,
      courseId: best.id,
      courseAbbr: best.abbr,
      courseName: best.name,
      sections,
      detectedSection,
      needsSectionPick: sections.length > 1 && !detectedSection,
    });
  }

  return { matched, unmatched };
}
