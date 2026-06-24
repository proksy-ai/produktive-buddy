import type { CSSProperties } from "react";

/**
 * Stable per-course accent color derived from the course key, so the same
 * class always looks the same across pages. Uses color-mix so the tinted
 * surfaces adapt to light/dark automatically.
 */

export const COURSE_COLOR_KEYS = [
  "indigo",
  "sky",
  "mint",
  "amber",
  "coral",
  "cyan",
  "lime",
  "plum",
] as const;

export type CourseColorKey = (typeof COURSE_COLOR_KEYS)[number];

const PALETTE: Record<CourseColorKey, string> = {
  indigo: "oklch(0.58 0.17 260)",
  sky: "oklch(0.62 0.14 225)",
  mint: "oklch(0.62 0.13 165)",
  amber: "oklch(0.72 0.13 78)",
  coral: "oklch(0.63 0.16 20)",
  cyan: "oklch(0.61 0.14 195)",
  lime: "oklch(0.67 0.13 130)",
  plum: "oklch(0.6 0.14 315)",
};

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function courseAccent(key: string): string {
  if (key in PALETTE) return PALETTE[key as CourseColorKey];
  return PALETTE[COURSE_COLOR_KEYS[hash(key) % COURSE_COLOR_KEYS.length]];
}

/** Inline style vars for a tinted course chip/card. */
export function courseAccentStyle(key: string): CSSProperties {
  const accent = courseAccent(key);
  return {
    ["--accent-color" as string]: accent,
    ["--accent-soft" as string]: `color-mix(in oklch, ${accent} 14%, transparent)`,
    ["--accent-strong" as string]: `color-mix(in oklch, ${accent} 22%, transparent)`,
  };
}
