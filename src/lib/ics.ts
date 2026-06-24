import type { ClassSession } from "@/lib/schedule";

const IST_OFFSET_MIN = 5 * 60 + 30; // IST = UTC+5:30, no DST

/** Convert a campus-local date+time (IST) to a UTC iCal timestamp. */
export function toUtcStamp(ymd: string, hm: string): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const [h, mi] = hm.split(":").map(Number);
  const utc = new Date(Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MIN * 60000);
  return (
    utc.getUTCFullYear().toString().padStart(4, "0") +
    String(utc.getUTCMonth() + 1).padStart(2, "0") +
    String(utc.getUTCDate()).padStart(2, "0") +
    "T" +
    String(utc.getUTCHours()).padStart(2, "0") +
    String(utc.getUTCMinutes()).padStart(2, "0") +
    "00Z"
  );
}

export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildCalendar(
  sessions: ClassSession[],
  calendarName: string,
): string {
  const now = toUtcStamp(
    new Date().toISOString().slice(0, 10),
    new Date().toISOString().slice(11, 16),
  );

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kairo//Campus Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    "X-WR-TIMEZONE:Asia/Kolkata",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const s of sessions) {
    const summaryBase = `${s.courseAbbr} · ${s.courseName}`;
    const summary =
      s.status === "CANCELLED" ? `Cancelled: ${summaryBase}` : summaryBase;
    const descParts = [
      s.faculty ? `Faculty: ${s.faculty}` : null,
      s.sectionCode ? `Section: ${s.sectionCode}` : null,
    ].filter(Boolean);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@kairo`,
      `DTSTAMP:${now}`,
      `DTSTART:${toUtcStamp(s.date, s.startTime)}`,
      `DTEND:${toUtcStamp(s.date, s.endTime)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
    );
    if (s.room) lines.push(`LOCATION:${escapeIcsText(s.room)}`);
    if (descParts.length) lines.push(`DESCRIPTION:${escapeIcsText(descParts.join("\n"))}`);
    if (s.status === "CANCELLED") lines.push("STATUS:CANCELLED");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  // iCal requires CRLF line endings.
  return lines.join("\r\n");
}
