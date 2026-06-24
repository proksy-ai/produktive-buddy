"use client";

import { Check, ChevronDown, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CoursePickerItem {
  id: string;
  abbr: string;
  name: string;
  faculty: string | null;
  credits: number | null;
  group: string;
}

export function CoursePicker({
  courses,
  initialSelected,
}: {
  courses: CoursePickerItem[];
  initialSelected: string[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set(initialSelected));
  const [open, setOpen] = useState(new Set(courses.map((c) => c.group)));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) =>
      [c.abbr, c.name, c.faculty ?? "", c.group]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [courses, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CoursePickerItem[]>();
    for (const course of filtered) {
      const list = map.get(course.group) ?? [];
      list.push(course);
      map.set(course.group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/courses/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds: [...selected] }),
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
      <div className="sticky top-16 z-10 rounded-2xl border border-border bg-background/90 p-3 shadow-sm backdrop-blur">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, code, or faculty..."
            className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {selected.size} course{selected.size === 1 ? "" : "s"} selected
          </p>
          <Button size="sm" onClick={() => void save()} disabled={saving || selected.size === 0}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saved ? "Saved" : "Save courses"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </div>

      {groups.map(([group, items]) => {
        const expanded = open.has(group);
        return (
          <section key={group} className="rounded-2xl border border-border bg-card shadow-sm">
            <button
              type="button"
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (next.has(group)) next.delete(group);
                  else next.add(group);
                  return next;
                })
              }
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span>
                <span className="text-sm font-semibold">{group}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({items.length})
                </span>
              </span>
              <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
            </button>

            {expanded ? (
              <div className="border-t border-border p-2">
                {items.map((course) => {
                  const active = selected.has(course.id);
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => toggle(course.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        active ? "bg-primary/10" : "hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                          active && "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        {active ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-snug">
                          {course.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {course.abbr}
                          {course.credits ? ` · ${course.credits} credits` : ""}
                          {course.faculty ? ` · ${course.faculty}` : ""}
                        </span>
                      </span>
                    </button>
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
