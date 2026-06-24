import { db } from "@/lib/db";

const INSTITUTE_EMAIL_DOMAIN = "iimk.ac.in";

export function normalizeInstituteEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isInstituteEmail(email: string): boolean {
  const normalized = normalizeInstituteEmail(email);
  return (
    normalized.endsWith(`@${INSTITUTE_EMAIL_DOMAIN}`) &&
    normalized.length > INSTITUTE_EMAIL_DOMAIN.length + 1
  );
}

/** Extract the local-part prefix that maps to a batch (longest rule wins). */
export async function resolveBatchFromEmail(email: string) {
  const normalized = normalizeInstituteEmail(email);
  if (!isInstituteEmail(normalized)) return null;

  const local = normalized.split("@")[0] ?? "";
  const rules = await db.emailPrefixRule.findMany({
    include: {
      batch: {
        include: { program: { include: { college: true } } },
      },
    },
    orderBy: { prefix: "desc" },
  });

  const match = rules
    .filter((r) => local.startsWith(r.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  return match?.batch ?? null;
}
