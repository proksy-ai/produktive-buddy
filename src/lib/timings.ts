/**
 * Parse human-readable course timings like
 * "MON(1045-1200), TUE(1045-1200), FRI(1045-1200)" and detect clashes.
 */

export interface TimeSlot {
  day: string; // MON, TUE, WED, THU, FRI, SAT, SUN
  start: number; // minutes from midnight
  end: number;
}

function toMinutes(hhmm: string): number {
  const clean = hhmm.trim();
  // Accept "915" or "1045" (3-4 digits).
  const padded = clean.padStart(4, "0");
  const h = Number(padded.slice(0, padded.length - 2));
  const m = Number(padded.slice(padded.length - 2));
  return h * 60 + m;
}

export function parseTimings(raw: string | null | undefined): TimeSlot[] {
  if (!raw) return [];
  const slots: TimeSlot[] = [];
  const re = /([A-Za-z]{3})\s*\(\s*(\d{3,4})\s*-\s*(\d{3,4})\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    slots.push({
      day: m[1].toUpperCase(),
      start: toMinutes(m[2]),
      end: toMinutes(m[3]),
    });
  }
  return slots;
}

function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return a.day === b.day && a.start < b.end && b.start < a.end;
}

/** True if any slot in A overlaps any slot in B (same day, overlapping time). */
export function timingsClash(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const sa = parseTimings(a);
  const sb = parseTimings(b);
  for (const x of sa) {
    for (const y of sb) {
      if (slotsOverlap(x, y)) return true;
    }
  }
  return false;
}

/** Format a compact, readable label for a timings string. */
export function formatTimings(raw: string | null | undefined): string {
  const slots = parseTimings(raw);
  if (slots.length === 0) return raw ?? "TBA";
  const fmt = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  return slots.map((s) => `${s.day} ${fmt(s.start)}–${fmt(s.end)}`).join(" · ");
}
