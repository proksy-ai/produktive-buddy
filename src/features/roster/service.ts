import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { BRAND } from "@/lib/brand";

export interface RosterInput {
  email: string;
  name?: string | null;
  rollNumber?: string | null;
  batchLabel?: string | null;
}

const HEADER_ALIASES: Record<string, keyof RosterInput> = {
  email: "email",
  "email id": "email",
  "email address": "email",
  name: "name",
  "full name": "name",
  roll: "rollNumber",
  "roll no": "rollNumber",
  "roll number": "rollNumber",
  rollnumber: "rollNumber",
  batch: "batchLabel",
  "batch label": "batchLabel",
  program: "batchLabel",
};

function splitLine(line: string): string[] {
  // Simple CSV: handles quoted cells with commas.
  const out: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      out.push(cell.trim());
      cell = "";
    } else cell += c;
  }
  out.push(cell.trim());
  return out;
}

/** Parse pasted CSV/TSV. Supports a header row or positional email,name,roll,batch. */
export function parseRosterCsv(text: string): RosterInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const firstCells = splitLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader = firstCells.some((c) => c in HEADER_ALIASES);
  let cols: (keyof RosterInput | null)[] = ["email", "name", "rollNumber", "batchLabel"];
  let start = 0;
  if (hasHeader) {
    cols = firstCells.map((c) => HEADER_ALIASES[c] ?? null);
    start = 1;
  }

  const seen = new Set<string>();
  const rows: RosterInput[] = [];
  for (let i = start; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const row: RosterInput = { email: "" };
    cells.forEach((val, idx) => {
      const key = cols[idx];
      if (key) (row[key] as string) = val;
    });
    const email = row.email?.toLowerCase().trim();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    rows.push({
      email,
      name: row.name || null,
      rollNumber: row.rollNumber || null,
      batchLabel: row.batchLabel || null,
    });
  }
  return rows;
}

export async function importRoster(
  entries: RosterInput[],
  source: string,
): Promise<{ imported: number }> {
  let imported = 0;
  // Chunk to keep transactions small.
  for (const e of entries) {
    await db.rosterEntry.upsert({
      where: { email: e.email },
      create: {
        email: e.email,
        name: e.name ?? null,
        rollNumber: e.rollNumber ?? null,
        batchLabel: e.batchLabel ?? null,
        source,
      },
      update: {
        name: e.name ?? undefined,
        rollNumber: e.rollNumber ?? undefined,
        batchLabel: e.batchLabel ?? undefined,
      },
    });
    imported++;
  }
  return { imported };
}

export async function getRosterStats(): Promise<{
  total: number;
  invited: number;
  joined: number;
}> {
  const [total, invited, joined] = await Promise.all([
    db.rosterEntry.count(),
    db.rosterEntry.count({ where: { invitedAt: { not: null } } }),
    db.rosterEntry.count({ where: { joinedAt: { not: null } } }),
  ]);
  return { total, invited, joined };
}

function inviteEmail(appUrl: string, name?: string | null) {
  const hi = name?.trim() ? name.trim().split(/\s+/)[0] : "there";
  const subject = `You're invited to ${BRAND.name}`;
  const text = `Hi ${hi},\n\n${BRAND.name} keeps your IIMK schedule, attendance, mess, and shuttle in one fast place. Sign in with your @iimk.ac.in email here: ${appUrl}\n\nSee you inside.`;
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:460px;margin:0 auto;padding:24px;color:#111">
      <h1 style="font-size:20px;margin:0 0 12px">You're invited to ${BRAND.name}</h1>
      <p style="margin:0 0 16px;color:#444">Hi ${hi}, your IIMK schedule, attendance, mess menu, and shuttle — in one fast place.</p>
      <a href="${appUrl}" style="display:inline-block;background:#111;color:#fff;font-weight:700;padding:12px 18px;border-radius:8px;text-decoration:none">Open ${BRAND.name}</a>
      <p style="margin:16px 0 0;color:#888;font-size:12px">Sign in with your @iimk.ac.in email. If this wasn't meant for you, ignore it.</p>
    </div>`;
  return { subject, text, html };
}

/**
 * Send invites to roster entries (default: not yet invited), in a bounded batch.
 * Returns counts. Safe to call repeatedly to work through a large roster.
 */
export async function sendInvites(
  appUrl: string,
  opts: { onlyUninvited?: boolean; limit?: number } = {},
): Promise<{ sent: number; failed: number; remaining: number }> {
  const onlyUninvited = opts.onlyUninvited ?? true;
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);

  const where = onlyUninvited ? { invitedAt: null } : {};
  const batch = await db.rosterEntry.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, email: true, name: true },
  });

  let sent = 0;
  let failed = 0;
  for (const entry of batch) {
    try {
      const { subject, text, html } = inviteEmail(appUrl, entry.name);
      await sendEmail({ to: entry.email, subject, text, html });
      await db.rosterEntry.update({
        where: { id: entry.id },
        data: { invitedAt: new Date() },
      });
      sent++;
      // Gentle pacing for provider rate limits.
      await new Promise((r) => setTimeout(r, 120));
    } catch {
      failed++;
    }
  }

  const remaining = onlyUninvited
    ? await db.rosterEntry.count({ where: { invitedAt: null } })
    : 0;
  return { sent, failed, remaining };
}
