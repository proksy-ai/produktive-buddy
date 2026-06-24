import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProgramKind, SheetKind } from "@prisma/client";

import { IIMK_SHEET_REGISTRY } from "../src/lib/sheets/registry";

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
        { programCode: "LSM", number: 6, label: "LSM06", startYear: 2025, endYear: 2027 },
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
          isActive: b.number !== 30,
        },
        update: { label: b.label },
      }),
    ),
  );

  const batchByLabel = Object.fromEntries(batches.map((b) => [b.label, b]));

  // Email prefix rules
  const prefixRules = [
    { prefix: "mba25", batchLabel: "PGP29" },
    { prefix: "mba26", batchLabel: "PGP30" },
    { prefix: "fin06", batchLabel: "FIN06" },
    { prefix: "lsm06", batchLabel: "LSM06" },
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
  for (const label of ["PGP29", "PGP30", "FIN06", "LSM06"] as const) {
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
      const term = await db.term.findUniqueOrThrow({
        where: {
          batchId_number: {
            batchId: batchByLabel[entry.batchLabel].id,
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
