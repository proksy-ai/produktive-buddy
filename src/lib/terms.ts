/** Which terms each batch shows, and which are live vs locked. */

export type TermAvailability = "live" | "locked" | "hidden";
export type BatchRollout = "ready" | "coming_soon";

type BatchTermRule = {
  rollout: BatchRollout;
  /** year1 = Terms I–III, year2 = Terms IV–VI */
  bucket: "year1" | "year2" | null;
  /** Term numbers that have synced schedule data today */
  liveTerms: number[];
};

const BATCH_RULES: Record<string, BatchTermRule> = {
  PGP29: { rollout: "ready", bucket: "year2", liveTerms: [4] },
  FIN06: { rollout: "ready", bucket: "year1", liveTerms: [1] },
  LSM06: { rollout: "ready", bucket: "year1", liveTerms: [1] },
  // Testing cohorts: reuse prior Term I sheets until the official new links land.
  PGP30: { rollout: "ready", bucket: "year1", liveTerms: [1] },
  FIN07: { rollout: "ready", bucket: "year1", liveTerms: [1] },
  LSM07: { rollout: "ready", bucket: "year1", liveTerms: [1] },
};

const YEAR1 = [1, 2, 3];
const YEAR2 = [4, 5, 6];

export function getBatchRule(batchLabel: string): BatchTermRule {
  return (
    BATCH_RULES[batchLabel] ?? {
      rollout: "coming_soon",
      bucket: null,
      liveTerms: [],
    }
  );
}

export function termsInBucket(bucket: "year1" | "year2"): number[] {
  return bucket === "year1" ? YEAR1 : YEAR2;
}

export function resolveTermAvailability(
  batchLabel: string,
  termNumber: number,
  hasCourses: boolean,
): TermAvailability {
  const rule = getBatchRule(batchLabel);
  if (rule.rollout === "coming_soon" || !rule.bucket) return "hidden";

  const visible = termsInBucket(rule.bucket);
  if (!visible.includes(termNumber)) return "hidden";

  if (rule.liveTerms.includes(termNumber) && hasCourses) return "live";
  return "locked";
}

export function defaultLiveTermNumber(batchLabel: string): number | null {
  const rule = getBatchRule(batchLabel);
  return rule.liveTerms[0] ?? null;
}
