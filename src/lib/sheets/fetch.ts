import { createHash } from "node:crypto";

export function contentHash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Parse a gviz CSV response into a 2D string array. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = "";
      if (ch === "\r") i++;
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}

async function fetchWithRetry(url: string, retries = 4): Promise<Response> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return res;
    lastStatus = res.status;
    if (res.status >= 500 && attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    break;
  }
  throw new Error(`Fetch failed (${lastStatus}): ${url}`);
}

export async function fetchSheetCsv(
  spreadsheetId: string,
  gid: string,
): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const res = await fetchWithRetry(url);
  return parseCsv(await res.text());
}

export async function fetchSheetHtml(
  spreadsheetId: string,
  gid: string,
): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview/sheet?headers=true&gid=${gid}`;
  const res = await fetchWithRetry(url);
  return res.text();
}

/** Build a map from CSS class (e.g. "s15") to background hex from rendered HTML. */
export function extractColorClassMap(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /\.(s\d+)\{[^}]*background-color:(#[0-9a-fA-F]{3,8})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    map.set(m[1], m[2].toLowerCase());
  }
  return map;
}

/** Extract cell text + color class from table rows in rendered HTML. */
export function extractHtmlCells(
  html: string,
): { row: number; col: number; text: string; colorClass: string | null }[] {
  const colorMap = extractColorClassMap(html);
  const cells: {
    row: number;
    col: number;
    text: string;
    colorClass: string | null;
  }[] = [];

  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowIdx = 0;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRe.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const tdRe = /<td[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/td>/gi;
    let colIdx = 0;
    let tdMatch: RegExpExecArray | null;

    while ((tdMatch = tdRe.exec(rowHtml)) !== null) {
      const classes = tdMatch[1].split(/\s+/);
      const colorClass =
        classes.find((c) => c.startsWith("s") && colorMap.has(c)) ?? null;
      const text = tdMatch[2]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();

      cells.push({ row: rowIdx, col: colIdx, text, colorClass });
      colIdx++;
    }
    rowIdx++;
  }

  return cells;
}

export function classifyCellColor(hex: string | null): "SCHEDULED" | "CANCELLED" | "RESCHEDULED" {
  if (!hex) return "SCHEDULED";
  const h = hex.toLowerCase();
  // Official sheet: red = cancelled, green = rescheduled.
  if (h === "#ff0000" || h.startsWith("#f00") || h === "#ea4335" || h === "#cc0000") {
    return "CANCELLED";
  }
  if (
    h === "#00ff00" ||
    h === "#0f0" ||
    h === "#34a853" ||
    h === "#6aa84f" ||
    h === "#93c47d" ||
    h === "#b6d7a8"
  ) {
    return "RESCHEDULED";
  }
  return "SCHEDULED";
}
