import type { ProgramKind } from "@prisma/client";

import { db } from "@/lib/db";
import {
  defaultLiveTermNumber,
  getBatchRule,
  resolveTermAvailability,
  type BatchRollout,
  type TermAvailability,
} from "@/lib/terms";

const TERM_NAMES = ["I", "II", "III", "IV", "V", "VI"];

export function isElectiveTerm(termNumber: number): boolean {
  return termNumber >= 4;
}

export function termRequiresCohortSection(
  programKind: ProgramKind,
  termNumber: number,
): boolean {
  return programKind === "PGP" && termNumber >= 1 && termNumber <= 3;
}

function programDisplayName(kind: ProgramKind, batchNumber: number): string {
  switch (kind) {
    case "PGP":
      return `PGP ${batchNumber}`;
    case "FIN":
      return "PGP-Finance";
    case "LSM":
      return "PGP-LSM";
    default:
      return `Batch ${batchNumber}`;
  }
}

export function firstName(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  return name.trim().split(/\s+/)[0] ?? null;
}

export async function getOnboardingContextForUser(
  userId: string,
  batchId: string | null,
) {
  if (!batchId) return null;

  const batch = await db.batch.findUnique({
    where: { id: batchId },
    include: { program: true },
  });
  if (!batch) return null;

  const rule = getBatchRule(batch.label);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      rollNumber: true,
      calendarPreference: true,
      onboardingCompletedAt: true,
      activeTermId: true,
      termNotifyRequests: { select: { termId: true } },
    },
  });

  const notifyTermIds = new Set(
    user?.termNotifyRequests.map((r) => r.termId) ?? [],
  );

  const terms = await db.term.findMany({
    where: { batchId },
    orderBy: { number: "asc" },
    include: {
      _count: { select: { courses: true } },
      cohortSections: { orderBy: { code: "asc" } },
    },
  });

  const programKind = batch.program.kind;

  const termsWithMeta = terms
    .map((t) => {
      const availability = resolveTermAvailability(
        batch.label,
        t.number,
        t._count.courses > 0,
      );
      return {
        id: t.id,
        number: t.number,
        name: `Term ${TERM_NAMES[t.number - 1] ?? t.number}`,
        availability,
        notifyRequested: notifyTermIds.has(t.id),
        isElective: isElectiveTerm(t.number),
        needsSection: termRequiresCohortSection(programKind, t.number),
        cohortSections: t.cohortSections.map((s) => ({
          id: s.id,
          code: s.code,
        })),
      };
    })
    .filter((t) => t.availability !== "hidden");

  const waitlistTermId =
    rule.rollout === "coming_soon"
      ? (terms.find((t) => t.number === 1)?.id ?? null)
      : null;

  const defaultLive = defaultLiveTermNumber(batch.label);
  const defaultTerm =
    termsWithMeta.find((t) => t.number === defaultLive && t.availability === "live") ??
    termsWithMeta.find((t) => t.availability === "live") ??
    termsWithMeta[0];

  return {
    user: {
      name: user?.name ?? "",
      rollNumber: user?.rollNumber ?? "",
      calendarPreference: user?.calendarPreference ?? "LATER",
      onboardingCompleted: Boolean(user?.onboardingCompletedAt),
      activeTermId: user?.activeTermId ?? defaultTerm?.id ?? null,
    },
    program: {
      kind: programKind,
      name: programDisplayName(programKind, batch.number),
      batchLabel: batch.label,
      session: `${batch.startYear}–${String(batch.endYear).slice(-2)}`,
    },
    rollout: rule.rollout as BatchRollout,
    terms: termsWithMeta,
    waitlistTermId,
    waitlistNotifyRequested: waitlistTermId
      ? notifyTermIds.has(waitlistTermId)
      : false,
    defaultTermId: defaultTerm?.id ?? null,
  };
}

export type OnboardingContextData = NonNullable<
  Awaited<ReturnType<typeof getOnboardingContextForUser>>
>;

export type OnboardingTerm = OnboardingContextData["terms"][number];

export type { TermAvailability, BatchRollout };
