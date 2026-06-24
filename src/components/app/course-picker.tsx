"use client";

import { Check, ChevronDown, Loader2, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatTimings, timingsClash } from "@/lib/timings";
import { cn } from "@/lib/utils";

export interface CoursePickerSection {
  code: string;
  timings: string | null;
  professor: string | null;
  totalSeats: number | null;
  remainingSeats: number | null;
}

export interface CoursePickerItem {
  id: string;
  abbr: string;
  name: string;
  faculty: string | null;
  credits: number | null;
  group: string; // area, e.g. ECO / FAC / IS
  sections: CoursePickerSection[];
}

type Selection = { courseId: string; section: CoursePickerSection };

const AREA_LABELS: Record<string, string> = {
  ECO: "Economics",
  OBHR: "Org. Behaviour & HR",
  FAC: "Finance & Accounting",
  HLAM: "Humanities, Law & Arts",
  IS: "Information Systems",
  DSOM: "Decision Sciences & Ops",
  MM: "Marketing",
  SM: "Strategy",
};

export function CoursePicker({
  courses,
  initialSelected,
}: {
  courses: CoursePickerItem[];
  initialSelected: { courseId: string; sectionCode: string }[];
}) {
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Map<string, Selection>>(() => {
    const map = new Map<string, Selection>();
    for (const init of initialSelected) {
      const course = courses.find((c) => c.id === init.courseId);
      const section =
        course?.sections.find((s) => s.code === init.sectionCode) ??
        course?.sections[0];
      if (course && section) map.set(course.id, { courseId: course.id, section });
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const areas = useMemo(
    () => [...new Set(courses.map((c) => c.group))].sort(),
    [courses],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (areaFilter && c.group !== areaFilter) return false;
      if (!q) return true;
      return [c.abbr, c.name, c.faculty ?? "", c.group]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [courses, query, areaFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, CoursePickerItem[]>();
    for (const c of filtered) {
      const list = map.get(c.group) ?? [];
      list.push(c);
      map.set(c.group, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const [open, setOpen] = useState<Set<string>>(() => new Set(areas));

  function clashesWithSelection(
    courseId: string,
    section: CoursePickerSection,
  ): boolean {
    for (const sel of selected.values()) {
      if (sel.courseId === courseId) continue;
      if (timingsClash(section.timings, sel.section.timings)) return true;
    }
    return false;
  }

  function toggleSection(course: CoursePickerItem, section: CoursePickerSection) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Map(prev);
      const existing = next.get(course.id);
      if (existing && existing.section.code === section.code) {
        next.delete(course.id);
      } else {
        next.set(course.id, { courseId: course.id, section });
      }
      return next;
    });
  }

  function toggleFav(id: string) {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalCredits = [...selected.values()].reduce((sum, s) => {
    const c = courses.find((x) => x.id === s.courseId);
    return sum + (c?.credits ?? 0);
  }, 0);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const courseIds = [...selected.keys()];
      const sectionByCourse: Record<string, string> = {};
      for (const s of selected.values()) {
        sectionByCourse[s.courseId] = s.section.code;
      }
      const res = await fetch("/api/courses/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds, sectionByCourse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* sticky control bar */}
      <div className="sticky top-16 z-10 rounded-md border-2 border-foreground bg-background p-3 shadow-nb">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search course, code, or professor…"
            className="h-11 w-full rounded-md border-2 border-foreground bg-card pl-9 pr-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setAreaFilter(null)}
            className={cn(
              "shrink-0 rounded-md border-2 border-foreground px-3 py-1 text-xs font-bold",
              areaFilter === null
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground",
            )}
          >
            All areas
          </button>
          {areas.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAreaFilter(a)}
              className={cn(
                "shrink-0 rounded-md border-2 border-foreground px-3 py-1 text-xs font-bold",
                areaFilter === a
                  ? "bg-accent text-accent-foreground shadow-nb-sm"
                  : "bg-card text-muted-foreground",
              )}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm font-bold">
            {selected.size} course{selected.size === 1 ? "" : "s"} ·{" "}
            {totalCredits} credits
          </p>
          <Button size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saved ? "Saved" : "Save courses"}
          </Button>
        </div>
        {error ? (
          <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>
        ) : null}
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-2 px-1 text-[11px] font-bold">
        <Legend className="bg-success text-success-foreground" label="Selected" />
        <Legend className="bg-destructive text-destructive-foreground" label="Clashes" />
        <Legend className="bg-muted text-muted-foreground" label="Full" />
        <Legend className="bg-accent text-accent-foreground" label="Favourite" />
      </div>

      {groups.map(([area, items]) => {
        const expanded = open.has(area);
        return (
          <section
            key={area}
            className="rounded-md border-2 border-foreground bg-card shadow-nb"
          >
            <button
              type="button"
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (next.has(area)) next.delete(area);
                  else next.add(area);
                  return next;
                })
              }
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2">
                <span className="rounded-md border-2 border-foreground bg-accent px-2 py-0.5 text-xs font-extrabold text-accent-foreground">
                  {area}
                </span>
                <span className="text-sm font-bold">
                  {AREA_LABELS[area] ?? area}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({items.length})
                </span>
              </span>
              <ChevronDown
                className={cn("size-4 transition-transform", expanded && "rotate-180")}
              />
            </button>

            {expanded ? (
              <div className="space-y-3 border-t-2 border-foreground p-3">
                {items.map((course) => {
                  const fav = favs.has(course.id);
                  const sel = selected.get(course.id);
                  return (
                    <div
                      key={course.id}
                      className="rounded-md border-2 border-foreground bg-background p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-snug">
                            {course.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {course.abbr} · {course.credits ?? 3} credits
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Favourite"
                          onClick={() => toggleFav(course.id)}
                          className={cn(
                            "shrink-0 rounded-md border-2 border-foreground p-1.5",
                            fav
                              ? "bg-accent text-accent-foreground shadow-nb-sm"
                              : "bg-card text-muted-foreground",
                          )}
                        >
                          <Star className={cn("size-4", fav && "fill-current")} />
                        </button>
                      </div>

                      <div className="mt-2.5 space-y-2">
                        {course.sections.map((section) => {
                          const isSelected = sel?.section.code === section.code;
                          const full = (section.remainingSeats ?? 0) <= 0;
                          const clash =
                            !isSelected && clashesWithSelection(course.id, section);
                          const disabled = full && !isSelected;
                          return (
                            <button
                              key={section.code}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleSection(course, section)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-md border-2 border-foreground px-3 py-2 text-left transition-all disabled:cursor-not-allowed",
                                isSelected
                                  ? "bg-success text-success-foreground shadow-nb-sm"
                                  : clash
                                    ? "bg-destructive/15 text-foreground"
                                    : full
                                      ? "bg-muted text-muted-foreground opacity-70"
                                      : "bg-card hover:bg-accent/30",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-foreground text-xs font-extrabold",
                                  isSelected
                                    ? "bg-background text-foreground"
                                    : "bg-accent text-accent-foreground",
                                )}
                              >
                                {section.code}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold">
                                  {formatTimings(section.timings)}
                                </span>
                                <span className="block truncate text-[11px] text-muted-foreground">
                                  {section.professor ?? course.faculty ?? "Faculty TBA"}
                                </span>
                              </span>
                              <span className="shrink-0 text-right">
                                <span
                                  className={cn(
                                    "block text-xs font-extrabold",
                                    full ? "text-destructive" : "",
                                  )}
                                >
                                  {full ? "FULL" : `${section.remainingSeats} left`}
                                </span>
                                {clash ? (
                                  <span className="block text-[10px] font-bold text-destructive">
                                    clashes
                                  </span>
                                ) : isSelected ? (
                                  <Check className="ml-auto size-4" />
                                ) : null}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-foreground bg-card px-2 py-0.5">
      <span className={cn("size-3 rounded-sm border border-foreground", className)} />
      {label}
    </span>
  );
}
