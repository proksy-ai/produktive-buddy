import type { ChangeType, SessionStatus } from "@prisma/client";

import { db } from "@/lib/db";
import {
  contentHash,
  fetchSheetCsv,
  fetchSheetHtml,
} from "@/lib/sheets/fetch";
import {
  buildStatusMapFromHtml,
  courseMatchesProgramFilter,
  parseCourseDetails,
  parseScheduleGrid,
  type ParsedSessionCell,
} from "@/lib/sheets/parse";

export interface SyncResult {
  sheetSourceId: string;
  label: string;
  changed: boolean;
  termsSynced: number;
  sessionsUpserted: number;
  changeEvents: number;
}

function sessionKey(s: ParsedSessionCell): string {
  return [
    s.date.toISOString().slice(0, 10),
    s.startTime,
    s.sourceColumn,
    s.rawCellText,
  ].join("|");
}

function statusToChangeType(status: SessionStatus): ChangeType | null {
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "RESCHEDULED") return "RESCHEDULED";
  return null;
}

async function upsertCoursesForTerm(
  termId: string,
  courses: ReturnType<typeof parseCourseDetails>,
  programFilter: string | null,
) {
  const filtered = courses.filter((c) =>
    courseMatchesProgramFilter(c, programFilter),
  );

  for (const c of filtered) {
    const course = await db.course.upsert({
      where: { termId_abbr: { termId, abbr: c.abbr } },
      create: {
        termId,
        abbr: c.abbr,
        name: c.name,
        credits: c.credits,
        faculty: c.faculty,
        programCode: c.programCode,
      },
      update: {
        name: c.name,
        credits: c.credits,
        faculty: c.faculty,
        programCode: c.programCode,
      },
    });

    for (const code of c.sections) {
      await db.courseSection.upsert({
        where: { courseId_code: { courseId: course.id, code } },
        create: { courseId: course.id, code },
        update: {},
      });
    }
  }
}

async function ensureCohortSections(
  termId: string,
  codes: string[],
  roomByCode: Map<string, string | null>,
) {
  for (const code of codes) {
    await db.cohortSection.upsert({
      where: { termId_code: { termId, code } },
      create: { termId, code, room: roomByCode.get(code) ?? null },
      update: { room: roomByCode.get(code) ?? undefined },
    });
  }
}

async function syncTermSessions(
  termId: string,
  sheetSourceId: string,
  parsed: ParsedSessionCell[],
  programFilter: string | null,
) {
  const courses = await db.course.findMany({
    where: { termId },
    include: { sections: true },
  });
  const courseByAbbr = new Map(courses.map((c) => [c.abbr, c]));
  const cohortSections = await db.cohortSection.findMany({ where: { termId } });
  const cohortByCode = new Map(cohortSections.map((c) => [c.code, c]));

  const existing = await db.session.findMany({ where: { termId } });
  const existingByKey = new Map(
    existing.map((s) => [
      [
        s.date.toISOString().slice(0, 10),
        s.startTime,
        s.sourceColumn ?? "",
        s.rawCellText ?? "",
      ].join("|"),
      s,
    ]),
  );

  let changeEvents = 0;
  let upserted = 0;
  const seenKeys = new Set<string>();

  for (const cell of parsed) {
    const course = courseByAbbr.get(cell.courseAbbr);
    if (!course) continue;

    // For combined sheets, skip cells that belong to other programs' columns.
    if (programFilter) {
      const col = cell.sourceColumn.toUpperCase();
      if (programFilter.includes("PGP")) {
        if (col.includes("FIN") || col.includes("LSM")) continue;
        if (!col.includes("PGP")) continue;
      } else if (programFilter.includes("FIN")) {
        if (!col.includes("FIN")) continue;
      } else if (programFilter.includes("LSM")) {
        if (!col.includes("LSM")) continue;
      }
    }

    const key = sessionKey(cell);
    seenKeys.add(key);

    const courseSection = cell.courseSectionCode
      ? course.sections.find((s) => s.code === cell.courseSectionCode)
      : null;
    const cohortSection = cell.cohortSectionCode
      ? cohortByCode.get(cell.cohortSectionCode)
      : null;

    const prev = existingByKey.get(key);
    const changeType = statusToChangeType(cell.status);

    if (prev && prev.status !== cell.status && changeType) {
      await db.changeEvent.create({
        data: {
          sheetSourceId,
          sessionId: prev.id,
          type: changeType,
          summary: `${cell.rawCellText} on ${key.split("|")[0]} ${cell.startTime} is now ${cell.status.toLowerCase()}`,
        },
      });
      changeEvents++;
    }

    if (prev) {
      await db.session.update({
        where: { id: prev.id },
        data: {
          status: cell.status,
          room: cell.room,
          endTime: cell.endTime,
          courseSectionId: courseSection?.id ?? null,
          cohortSectionId: cohortSection?.id ?? null,
        },
      });
    } else {
      await db.session.create({
        data: {
          termId,
          courseId: course.id,
          courseSectionId: courseSection?.id ?? null,
          cohortSectionId: cohortSection?.id ?? null,
          date: cell.date,
          startTime: cell.startTime,
          endTime: cell.endTime,
          room: cell.room,
          status: cell.status,
          sourceColumn: cell.sourceColumn,
          rawCellText: cell.rawCellText,
        },
      });
    }
    upserted++;
  }

  // Remove sessions no longer in the sheet.
  for (const [key, session] of existingByKey) {
    if (!seenKeys.has(key)) {
      await db.changeEvent.create({
        data: {
          sheetSourceId,
          sessionId: session.id,
          type: "REMOVED",
          summary: `Session removed: ${session.rawCellText ?? "class"} on ${key.split("|")[0]}`,
        },
      });
      changeEvents++;
      await db.session.delete({ where: { id: session.id } });
    }
  }

  return { upserted, changeEvents };
}

export async function syncSheetSource(
  sheetSourceId: string,
): Promise<SyncResult> {
  const source = await db.sheetSource.findUniqueOrThrow({
    where: { id: sheetSourceId },
    include: {
      terms: {
        include: { term: { include: { batch: true } } },
      },
    },
  });

  const [courseRows, scheduleRows, html] = await Promise.all([
    source.courseDetailsGid
      ? fetchSheetCsv(source.spreadsheetId, source.courseDetailsGid)
      : Promise.resolve([] as string[][]),
    fetchSheetCsv(source.spreadsheetId, source.scheduleGid),
    fetchSheetHtml(source.spreadsheetId, source.scheduleGid),
  ]);

  const hash = contentHash(JSON.stringify({ courseRows, scheduleRows }));
  const changed = hash !== source.lastContentHash;

  await db.syncSnapshot.create({
    data: {
      sheetSourceId,
      contentHash: hash,
      raw: { rowCount: scheduleRows.length },
    },
  });

  if (!changed && source.lastSyncedAt) {
    return {
      sheetSourceId,
      label: source.label,
      changed: false,
      termsSynced: 0,
      sessionsUpserted: 0,
      changeEvents: 0,
    };
  }

  const courses = parseCourseDetails(courseRows);
  const statusMap = buildStatusMapFromHtml(html);
  const allSessions = parseScheduleGrid(scheduleRows, statusMap);

  const cohortCodes = new Set<string>();
  const roomByCode = new Map<string, string | null>();
  for (const s of allSessions) {
    if (s.cohortSectionCode) {
      cohortCodes.add(s.cohortSectionCode);
      if (s.room) roomByCode.set(s.cohortSectionCode, s.room);
    }
  }

  let totalUpserted = 0;
  let totalChanges = 0;

  for (const link of source.terms) {
    const { termId, programFilter } = link;
    await upsertCoursesForTerm(termId, courses, programFilter);
    if (cohortCodes.size > 0) {
      await ensureCohortSections(termId, [...cohortCodes], roomByCode);
    }
    const { upserted, changeEvents } = await syncTermSessions(
      termId,
      sheetSourceId,
      allSessions,
      programFilter,
    );
    totalUpserted += upserted;
    totalChanges += changeEvents;
  }

  await db.sheetSource.update({
    where: { id: sheetSourceId },
    data: { lastSyncedAt: new Date(), lastContentHash: hash },
  });

  return {
    sheetSourceId,
    label: source.label,
    changed: true,
    termsSynced: source.terms.length,
    sessionsUpserted: totalUpserted,
    changeEvents: totalChanges,
  };
}

export async function syncAllSheetSources(): Promise<SyncResult[]> {
  const sources = await db.sheetSource.findMany({ orderBy: { label: "asc" } });
  const results: SyncResult[] = [];
  for (const s of sources) {
    try {
      results.push(await syncSheetSource(s.id));
      // Brief pause to avoid Google rate limits between sheets.
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      console.error(`[sync] failed for ${s.label}:`, err);
      results.push({
        sheetSourceId: s.id,
        label: s.label,
        changed: false,
        termsSynced: 0,
        sessionsUpserted: 0,
        changeEvents: 0,
      });
    }
  }
  return results;
}
