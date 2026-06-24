import type { CourseCategory, SessionKind, SessionStatus } from "@prisma/client";

import {
  classifyCellColor,
  extractColorClassMap,
  extractHtmlCells,
} from "@/lib/sheets/fetch";

export interface ParsedCourse {
  abbr: string;
  name: string;
  sections: string[];
  credits: number | null;
  faculty: string | null;
  programCode: string | null;
  category: CourseCategory;
}

export interface ParsedSessionCell {
  date: Date;
  startTime: string;
  endTime: string;
  sourceColumn: string;
  rawCellText: string;
  courseAbbr: string;
  courseSectionCode: string | null;
  cohortSectionCode: string | null;
  room: string | null;
  status: SessionStatus;
  kind: SessionKind;
}

const SECTION_SPLIT = /[,/]/;
const LUNCH_RE = /lunch\s*break/i;
const MEETING_RE = /^meeting$/i;
const QUIZ_RE = /\b(quiz|test)\b/i;
const EXAM_RE = /\b(mid[\s-]?term|end[\s-]?term|exam|assessment)\b/i;
const TUTORIAL_RE = /\b(tutorial|tut)\b/i;
const WORKSHOP_RE = /\b(workshop|lab|simulation)\b/i;
const GUEST_RE = /\b(guest|speaker|talk)\b/i;

export function parseCourseDetails(rows: string[][]): ParsedCourse[] {
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.toLowerCase());
  const abbrIdx = header.findIndex((h) => h.includes("abbr"));
  const nameIdx = header.findIndex((h) => h.includes("course"));
  const sectionIdx = header.findIndex((h) => h.includes("section"));
  const creditIdx = header.findIndex((h) => h.includes("credit"));
  const facultyIdx = header.findIndex((h) => h.includes("faculty"));
  const programIdx = header.findIndex((h) => h.includes("programme"));

  const courses: ParsedCourse[] = [];
  let currentProgram: string | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c.trim())) continue;

    const programCell = programIdx >= 0 ? row[programIdx]?.trim() : "";
    if (programCell) currentProgram = programCell;

    const abbr = (abbrIdx >= 0 ? row[abbrIdx] : row[4])?.trim();
    if (!abbr) continue;

    const name = (nameIdx >= 0 ? row[nameIdx] : row[2])?.trim() ?? abbr;
    const sectionRaw = sectionIdx >= 0 ? row[sectionIdx]?.trim() : "A";
    const sections = sectionRaw
      ? sectionRaw.split(SECTION_SPLIT).map((s) => s.trim()).filter(Boolean)
      : ["A"];

    const creditRaw = creditIdx >= 0 ? row[creditIdx]?.trim() : "";
    const credits = creditRaw ? parseFloat(creditRaw) : null;

    courses.push({
      abbr,
      name,
      sections,
      credits: credits && !Number.isNaN(credits) ? credits : null,
      faculty: facultyIdx >= 0 ? row[facultyIdx]?.trim() || null : null,
      programCode: currentProgram,
      category: inferCourseCategory(abbr, name, currentProgram),
    });
  }

  return courses;
}

function inferCourseCategory(
  abbr: string,
  name: string,
  programCode: string | null,
): CourseCategory {
  const text = `${abbr} ${name} ${programCode ?? ""}`;
  if (/\b(lab|simulation)\b/i.test(text)) return "LAB";
  if (/\b(workshop|bootcamp)\b/i.test(text)) return "WORKSHOP";
  if (/\b(elective|pgp\s*29|fin|lsm)\b/i.test(text) || /\(.+\)/.test(abbr)) {
    return "ELECTIVE";
  }
  return "CORE";
}

export function courseMatchesProgramFilter(
  course: ParsedCourse,
  programFilter: string | null,
): boolean {
  if (!programFilter) return true;
  const filter = programFilter.toUpperCase();
  const code = (course.programCode ?? "").toUpperCase();
  const abbr = course.abbr.toUpperCase();

  if (filter.includes("PGP") && (code.includes("PGP 29") || code.includes("PGP29"))) {
    return !abbr.includes("(FIN") && !abbr.includes("(LSM");
  }
  if (filter.includes("FIN") && (code.includes("FIN") || abbr.includes("(FIN"))) {
    return true;
  }
  if (filter.includes("LSM") && (code.includes("LSM") || abbr.includes("(LSM"))) {
    return true;
  }
  return code.includes(filter) || abbr.includes(filter);
}

function parseTimeSlot(raw: string): { startTime: string; endTime: string } | null {
  const cleaned = raw.replace(/\u2013|\u2014|-/g, "-").trim();
  const m = cleaned.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
  if (!m) return null;
  const pad = (h: string, min: string) =>
    `${h.padStart(2, "0")}:${min.padStart(2, "0")}`;
  return {
    startTime: pad(m[1], m[2]),
    endTime: pad(m[3], m[4]),
  };
}

function parseSheetDate(raw: string): Date | null {
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function parseCourseCell(raw: string): {
  abbr: string;
  sectionCode: string | null;
  kind: SessionKind;
} | null {
  const text = raw.replace(/\n/g, " ").trim();
  if (!text || LUNCH_RE.test(text) || MEETING_RE.test(text)) return null;

  const sectionMatch = text.match(/^(.+?)-([A-Z])$/);
  if (sectionMatch) {
    const abbr = sectionMatch[1].trim();
    return {
      abbr,
      sectionCode: sectionMatch[2],
      kind: inferSessionKind(text),
    };
  }

  return { abbr: text, sectionCode: null, kind: inferSessionKind(text) };
}

function inferSessionKind(text: string): SessionKind {
  if (EXAM_RE.test(text)) return "EXAM";
  if (QUIZ_RE.test(text)) return "QUIZ";
  if (TUTORIAL_RE.test(text)) return "TUTORIAL";
  if (GUEST_RE.test(text)) return "GUEST_LECTURE";
  if (WORKSHOP_RE.test(text)) return "WORKSHOP";
  return "CLASS";
}

interface ScheduleColumn {
  index: number;
  header: string;
  sourceColumn: string;
  cohortSectionCode: string | null;
  room: string | null;
}

function detectScheduleColumns(headerRow: string[]): {
  dateCol: number;
  timeCol: number;
  columns: ScheduleColumn[];
} {
  const lower = headerRow.map((h) => h.toLowerCase());
  const dateCol = lower.findIndex((h) => h.includes("date"));
  const timeCol = lower.findIndex((h) => h.includes("time"));

  const columns: ScheduleColumn[] = [];

  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i]?.trim() ?? "";
    if (!header || i === dateCol || i === timeCol) continue;
    if (LUNCH_RE.test(header)) continue;

    const cohortMatch = header.match(/sec\s*([A-H])/i);
    const roomMatch = header.match(/^(CR\s*[A-Z]\d)/i);

    if (cohortMatch) {
      columns.push({
        index: i,
        header,
        sourceColumn: header,
        cohortSectionCode: cohortMatch[1].toUpperCase(),
        room: roomMatch?.[1] ?? null,
      });
      continue;
    }

    if (/^[A-Z0-9-]+\s+[A-Z]\d/i.test(header) || header.includes("PGP")) {
      columns.push({
        index: i,
        header,
        sourceColumn: header,
        cohortSectionCode: null,
        room: null,
      });
    }
  }

  return {
    dateCol: dateCol >= 0 ? dateCol : 0,
    timeCol: timeCol >= 0 ? timeCol : 1,
    columns,
  };
}

export function parseScheduleGrid(
  rows: string[][],
  statusByRowCol: Map<string, SessionStatus>,
): ParsedSessionCell[] {
  if (rows.length < 2) return [];

  const { dateCol, timeCol, columns } = detectScheduleColumns(rows[0]);
  const sessions: ParsedSessionCell[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const dateRaw = row[dateCol]?.trim();
    const timeRaw = row[timeCol]?.trim();
    if (!dateRaw || !timeRaw) continue;

    const date = parseSheetDate(dateRaw);
    const times = parseTimeSlot(timeRaw);
    if (!date || !times) continue;

    for (const col of columns) {
      const rawCell = row[col.index]?.trim();
      if (!rawCell) continue;

      const parsed = parseCourseCell(rawCell);
      if (!parsed) continue;

      sessions.push({
        date,
        startTime: times.startTime,
        endTime: times.endTime,
        sourceColumn: col.sourceColumn,
        rawCellText: rawCell,
        courseAbbr: parsed.abbr,
        courseSectionCode: parsed.sectionCode,
        cohortSectionCode: col.cohortSectionCode,
        room: col.room,
        status: statusByRowCol.get(`${r}:${col.index}`) ?? "SCHEDULED",
        kind: parsed.kind,
      });
    }
  }

  return sessions;
}

export function buildStatusMapFromHtml(html: string): Map<string, SessionStatus> {
  const classColors = extractColorClassMap(html);
  const htmlCells = extractHtmlCells(html);
  const map = new Map<string, SessionStatus>();

  for (const cell of htmlCells) {
    if (!cell.text.trim()) continue;
    const hex = cell.colorClass ? classColors.get(cell.colorClass) ?? null : null;
    map.set(`${cell.row}:${cell.col}`, classifyCellColor(hex));
  }

  return map;
}
