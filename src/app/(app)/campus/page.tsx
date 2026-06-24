import { Bus, Clock3, Phone, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import {
  getCampusEssentials,
  getNextShuttles,
  getRelevantMealMenu,
  getShuttleSchedule,
  MEAL_WINDOWS,
} from "@/lib/campus";
import { campusNow } from "@/lib/schedule";

export const metadata: Metadata = { title: "Campus" };

export default async function CampusPage() {
  const now = campusNow();
  const [meal, essentials, nextShuttles, schedule] = await Promise.all([
    getRelevantMealMenu(now),
    getCampusEssentials(),
    getNextShuttles(now, 3),
    getShuttleSchedule(),
  ]);

  const mealActive = now.hm >= meal.startsAt && now.hm <= meal.endsAt;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campus"
        subtitle="Mess and shuttle, shown like your next class."
      />

      {/* Mess widget — styled like a lecture block */}
      <section>
        <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          Mess
        </h2>
        <div className="rounded-md border-2 border-foreground bg-card shadow-nb">
          <div className="flex items-center gap-3 border-b-2 border-foreground bg-accent p-4 text-accent-foreground">
            <span className="flex size-11 items-center justify-center rounded-md border-2 border-foreground bg-card text-foreground shadow-nb-sm">
              <UtensilsCrossed className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase">
                {mealActive ? `${meal.label} · serving now` : `${meal.label} · next`}
              </p>
              <p className="text-lg font-extrabold leading-tight">{meal.label}</p>
            </div>
            <span className="rounded-md border-2 border-foreground bg-card px-2 py-1 text-xs font-extrabold text-foreground tabular-nums">
              {meal.startsAt}–{meal.endsAt}
            </span>
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold leading-relaxed">
              {meal.items.join(" · ")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {MEAL_WINDOWS.map((w) => {
                const active = w.meal === meal.meal;
                return (
                  <div
                    key={w.meal}
                    className={`rounded-md border-2 border-foreground p-2 text-center ${active ? "bg-accent text-accent-foreground shadow-nb-sm" : "bg-card"}`}
                  >
                    <p className="text-xs font-extrabold">{w.label}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {w.startsAt}–{w.endsAt}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Shuttle widget — next departures as lecture-style rows */}
      <section>
        <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          Shuttle · next up
        </h2>
        <div className="space-y-2">
          {nextShuttles.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-md border-2 border-foreground bg-card p-3 shadow-nb"
            >
              <div className="w-14 shrink-0 text-center">
                <p className="text-sm font-extrabold tabular-nums">{t.departTime}</p>
                <span className="mt-1 inline-flex items-center justify-center rounded-md border-2 border-foreground bg-primary px-1.5 text-[10px] font-extrabold text-primary-foreground">
                  <Bus className="size-3" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {t.fromStop} → {t.toStop}
                  {t.finalStop ? ` → ${t.finalStop}` : ""}
                </p>
                {t.extendedToMainGate ? (
                  <p className="text-[11px] font-bold text-primary">
                    Extended to Main Gate
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Phase V shuttle</p>
                )}
              </div>
            </div>
          ))}
          {nextShuttles.length === 0 ? (
            <p className="rounded-md border-2 border-dashed border-foreground p-4 text-sm text-muted-foreground">
              No shuttle data loaded yet.
            </p>
          ) : null}
        </div>
      </section>

      {/* Full shuttle timetable */}
      {schedule.length > 0 ? (
        <details className="rounded-md border-2 border-foreground bg-card shadow-nb">
          <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-extrabold">
            <Clock3 className="size-4" />
            Full shuttle timetable ({schedule.length} trips)
          </summary>
          <div className="max-h-80 space-y-1 overflow-y-auto border-t-2 border-foreground p-3">
            {schedule.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-sm px-2 py-1.5 text-xs odd:bg-muted/40"
              >
                <span className="w-6 shrink-0 font-bold text-muted-foreground">
                  {t.sequence}
                </span>
                <span className="w-12 shrink-0 font-extrabold tabular-nums">
                  {t.departTime}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {t.fromStop} → {t.toStop}
                  {t.finalStop ? ` → ${t.finalStop}` : ""}
                </span>
                {t.extendedToMainGate ? (
                  <span className="shrink-0 rounded-sm border border-foreground bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    Main Gate
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {/* Essentials */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          Essentials
        </h2>
        <div className="grid gap-3">
          {(essentials.length > 0 ? essentials : FALLBACK_ESSENTIALS).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-md border-2 border-foreground bg-card p-4 shadow-nb"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border-2 border-foreground bg-muted text-foreground">
                {item.kind === "SHUTTLE" ? (
                  <Bus className="size-5" />
                ) : (
                  <Phone className="size-5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const FALLBACK_ESSENTIALS = [
  {
    id: "mess",
    kind: "MESS_MENU" as const,
    title: "Mess menu",
    description: "Today-aware menu support is ready; add menu rows to make it live.",
    href: null,
    phone: null,
  },
  {
    id: "shuttle",
    kind: "SHUTTLE" as const,
    title: "Campus shuttle",
    description: "Timings can be added here without crowding the home screen.",
    href: null,
    phone: null,
  },
];
