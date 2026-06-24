import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  CampusEssentialKind,
  MealKind,
  PrismaClient,
  ProgramKind,
  SheetKind,
} from "@prisma/client";

import { IIMK_SHEET_REGISTRY } from "../src/lib/sheets/registry";
import { SHUTTLE_SCHEDULE, TERM4_CATALOG } from "./term4-catalog";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding IIM Kozhikode data...");

  const college = await db.college.upsert({
    where: { slug: "iimk" },
    create: {
      slug: "iimk",
      name: "Indian Institute of Management Kozhikode",
      timezone: "Asia/Kolkata",
    },
    update: {},
  });

  const programs = await Promise.all(
    (
      [
        { code: "PGP", kind: ProgramKind.PGP, name: "Post Graduate Programme" },
        { code: "FIN", kind: ProgramKind.FIN, name: "PGP-Finance" },
        { code: "LSM", kind: ProgramKind.LSM, name: "PGP-Liberal Studies & Management" },
      ] as const
    ).map((p) =>
      db.program.upsert({
        where: { collegeId_code: { collegeId: college.id, code: p.code } },
        create: { collegeId: college.id, ...p },
        update: { name: p.name },
      }),
    ),
  );

  const programByCode = Object.fromEntries(programs.map((p) => [p.code, p]));

  const batches = await Promise.all(
    (
      [
        { programCode: "PGP", number: 29, label: "PGP29", startYear: 2025, endYear: 2027 },
        { programCode: "PGP", number: 30, label: "PGP30", startYear: 2026, endYear: 2028 },
        { programCode: "FIN", number: 6, label: "FIN06", startYear: 2025, endYear: 2027 },
        { programCode: "FIN", number: 7, label: "FIN07", startYear: 2026, endYear: 2028 },
        { programCode: "LSM", number: 6, label: "LSM06", startYear: 2025, endYear: 2027 },
        { programCode: "LSM", number: 7, label: "LSM07", startYear: 2026, endYear: 2028 },
      ] as const
    ).map((b) =>
      db.batch.upsert({
        where: {
          programId_number: {
            programId: programByCode[b.programCode].id,
            number: b.number,
          },
        },
        create: {
          programId: programByCode[b.programCode].id,
          number: b.number,
          label: b.label,
          startYear: b.startYear,
          endYear: b.endYear,
          isActive: true,
        },
        update: { label: b.label, isActive: true },
      }),
    ),
  );

  const batchByLabel = Object.fromEntries(batches.map((b) => [b.label, b]));

  // Email prefix rules
  const prefixRules = [
    { prefix: "mba25", batchLabel: "PGP29" },
    { prefix: "mba26", batchLabel: "PGP30" },
    { prefix: "fin06", batchLabel: "FIN06" },
    { prefix: "fin07", batchLabel: "FIN07" },
    { prefix: "lsm06", batchLabel: "LSM06" },
    { prefix: "lsm07", batchLabel: "LSM07" },
  ] as const;

  for (const rule of prefixRules) {
    await db.emailPrefixRule.upsert({
      where: { prefix: rule.prefix },
      create: {
        prefix: rule.prefix,
        batchId: batchByLabel[rule.batchLabel].id,
      },
      update: { batchId: batchByLabel[rule.batchLabel].id },
    });
  }

  // Terms 1-6 for each batch (PGP30 included for plug-and-play later)
  for (const label of ["PGP29", "PGP30", "FIN06", "FIN07", "LSM06", "LSM07"] as const) {
    const batch = batchByLabel[label];
    for (let n = 1; n <= 6; n++) {
      await db.term.upsert({
        where: { batchId_number: { batchId: batch.id, number: n } },
        create: {
          batchId: batch.id,
          number: n,
          name: `Term ${["I", "II", "III", "IV", "V", "VI"][n - 1]}`,
        },
        update: {},
      });
    }
  }

  // Sheet sources from registry
  for (const entry of IIMK_SHEET_REGISTRY) {
    const sheet = await db.sheetSource.upsert({
      where: {
        spreadsheetId_scheduleGid: {
          spreadsheetId: entry.spreadsheetId,
          scheduleGid: entry.scheduleGid,
        },
      },
      create: {
        spreadsheetId: entry.spreadsheetId,
        scheduleGid: entry.scheduleGid,
        courseDetailsGid: entry.courseDetailsGid,
        kind:
          entry.kind === "COMBINED" ? SheetKind.COMBINED : SheetKind.PER_PROGRAM,
        label: entry.label,
      },
      update: {
        courseDetailsGid: entry.courseDetailsGid,
        label: entry.label,
      },
    });

    if (entry.kind === "PER_PROGRAM" && entry.batchLabel) {
      const targetLabels = [
        entry.batchLabel,
        ...(entry.termNumber === 1 && entry.batchLabel === "PGP29" ? ["PGP30"] : []),
        ...(entry.termNumber === 1 && entry.batchLabel === "FIN06" ? ["FIN07"] : []),
        ...(entry.termNumber === 1 && entry.batchLabel === "LSM06" ? ["LSM07"] : []),
      ] as const;

      for (const targetLabel of targetLabels) {
        const term = await db.term.findUniqueOrThrow({
          where: {
            batchId_number: {
              batchId: batchByLabel[targetLabel].id,
              number: entry.termNumber,
            },
          },
        });
        await db.termSheetSource.upsert({
          where: {
            termId_sheetSourceId: { termId: term.id, sheetSourceId: sheet.id },
          },
          create: { termId: term.id, sheetSourceId: sheet.id },
          update: {},
        });
      }
    }

    if (entry.kind === "COMBINED" && "combinedBatches" in entry) {
      for (let i = 0; i < entry.combinedBatches.length; i++) {
        const batchLabel = entry.combinedBatches[i];
        const programFilter = entry.combinedProgramFilters[i];
        const term = await db.term.findUniqueOrThrow({
          where: {
            batchId_number: {
              batchId: batchByLabel[batchLabel].id,
              number: entry.termNumber,
            },
          },
        });
        await db.termSheetSource.upsert({
          where: {
            termId_sheetSourceId: { termId: term.id, sheetSourceId: sheet.id },
          },
          create: {
            termId: term.id,
            sheetSourceId: sheet.id,
            programFilter,
          },
          update: { programFilter },
        });
      }
    }
  }

  const essentials = [
    {
      kind: CampusEssentialKind.MESS_MENU,
      title: "Mess menu",
      description: "Breakfast, lunch, and dinner windows for today.",
      sortOrder: 10,
    },
    {
      kind: CampusEssentialKind.SHUTTLE,
      title: "Campus shuttle",
      description: "Add shuttle timings here when the transport sheet is available.",
      sortOrder: 20,
    },
    {
      kind: CampusEssentialKind.CONTACT,
      title: "Emergency contacts",
      description: "Keep critical campus contacts one tap away.",
      sortOrder: 30,
    },
  ];

  for (const item of essentials) {
    const id = `${college.id}:${item.kind}:${item.title}`;
    await db.campusEssential.upsert({
      where: { id },
      create: { id, collegeId: college.id, ...item },
      update: item,
    });
  }

  const mealWindows = [
    {
      meal: MealKind.BREAKFAST,
      startsAt: "08:00",
      endsAt: "10:45",
      items: "Masala Dosa, Idli & Sambar, Bread & Eggs, Fruit, Tea & Coffee",
    },
    {
      meal: MealKind.LUNCH,
      startsAt: "12:30",
      endsAt: "15:00",
      items: "Paneer Butter Masala, Dal Tadka, Jeera Rice, Roti, Salad, Curd",
    },
    {
      meal: MealKind.DINNER,
      startsAt: "20:00",
      endsAt: "22:00",
      items: "Veg Biryani, Chicken Curry, Mixed Veg, Roti, Raita, Gulab Jamun",
    },
  ];

  for (const window of mealWindows) {
    const id = `${college.id}:meal:${window.meal}`;
    await db.messMenu.upsert({
      where: { id },
      create: {
        id,
        collegeId: college.id,
        dayOfWeek: null,
        ...window,
      },
      update: window,
    });
  }

  // Campus shuttle timetable (shown like recurring lecture blocks).
  for (const trip of SHUTTLE_SCHEDULE) {
    const id = `${college.id}:shuttle:${trip.sequence}`;
    await db.shuttleTrip.upsert({
      where: { id },
      create: {
        id,
        collegeId: college.id,
        sequence: trip.sequence,
        departTime: trip.departTime,
        fromStop: trip.fromStop,
        toStop: trip.toStop,
        finalStop: trip.finalStop ?? null,
        extendedToMainGate: trip.extendedToMainGate ?? false,
      },
      update: {
        departTime: trip.departTime,
        fromStop: trip.fromStop,
        toStop: trip.toStop,
        finalStop: trip.finalStop ?? null,
        extendedToMainGate: trip.extendedToMainGate ?? false,
      },
    });
  }

  // Term IV elective catalog (PGP29) grouped by area, with section timings/seats.
  const pgp29 = batchByLabel["PGP29"];
  const termIV = await db.term.findUnique({
    where: { batchId_number: { batchId: pgp29.id, number: 4 } },
  });
  if (termIV) {
    for (const course of TERM4_CATALOG) {
      const created = await db.course.upsert({
        where: { termId_abbr: { termId: termIV.id, abbr: course.abbr } },
        create: {
          termId: termIV.id,
          abbr: course.abbr,
          name: course.name,
          credits: course.credits,
          faculty: course.sections[0]?.professor ?? null,
          area: course.area,
          category: "ELECTIVE",
        },
        update: {
          name: course.name,
          credits: course.credits,
          faculty: course.sections[0]?.professor ?? null,
          area: course.area,
          category: "ELECTIVE",
        },
      });

      for (const section of course.sections) {
        await db.courseSection.upsert({
          where: { courseId_code: { courseId: created.id, code: section.code } },
          create: {
            courseId: created.id,
            code: section.code,
            timings: section.timings,
            professor: section.professor,
            totalSeats: section.totalSeats,
            remainingSeats: section.remainingSeats,
          },
          update: {
            timings: section.timings,
            professor: section.professor,
            totalSeats: section.totalSeats,
            remainingSeats: section.remainingSeats,
          },
        });
      }
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
