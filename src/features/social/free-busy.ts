import type { ClassSession } from "@/lib/schedule";

export type FreeBusyState =
  | "both_free"
  | "both_busy"
  | "you_busy"
  | "friend_busy";

export function compareSlotsForDate(
  mine: ClassSession[],
  theirs: ClassSession[],
  date: string,
) {
  const starts = Array.from(
    new Set(
      [...mine, ...theirs]
        .filter((s) => s.date === date && s.status !== "CANCELLED")
        .flatMap((s) => [s.startTime, s.endTime]),
    ),
  ).sort();

  return starts.slice(0, -1).map((start, i) => {
    const end = starts[i + 1];
    const myClass = mine.find(
      (s) =>
        s.date === date &&
        s.status !== "CANCELLED" &&
        s.startTime < end &&
        s.endTime > start,
    );
    const theirClass = theirs.find(
      (s) =>
        s.date === date &&
        s.status !== "CANCELLED" &&
        s.startTime < end &&
        s.endTime > start,
    );
    const state: FreeBusyState =
      !myClass && !theirClass
        ? "both_free"
        : myClass && theirClass
          ? "both_busy"
          : myClass
            ? "you_busy"
            : "friend_busy";
    return {
      start,
      end,
      state,
      mine: myClass?.courseAbbr ?? null,
      theirs: theirClass?.courseAbbr ?? null,
    };
  });
}
