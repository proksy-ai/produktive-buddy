import type { CampusEssentialKind, MealKind } from "@prisma/client";

import { db } from "@/lib/db";

export interface MealWindow {
  meal: MealKind;
  label: string;
  startsAt: string;
  endsAt: string;
}

export interface MealMenu extends MealWindow {
  items: string[];
  source: "database" | "placeholder";
}

export interface CampusEssentialItem {
  id: string;
  kind: CampusEssentialKind;
  title: string;
  description: string | null;
  href: string | null;
  phone: string | null;
}

export const MEAL_WINDOWS: MealWindow[] = [
  { meal: "BREAKFAST", label: "Breakfast", startsAt: "08:00", endsAt: "10:45" },
  { meal: "LUNCH", label: "Lunch", startsAt: "12:30", endsAt: "15:00" },
  { meal: "DINNER", label: "Dinner", startsAt: "20:00", endsAt: "22:00" },
];

function dayOfWeek(ymd: string): number {
  return new Date(`${ymd}T12:00:00`).getDay();
}

function mealWindowFor(hm: string): MealWindow {
  const active = MEAL_WINDOWS.find((m) => hm >= m.startsAt && hm <= m.endsAt);
  if (active) return active;

  return MEAL_WINDOWS.find((m) => hm < m.startsAt) ?? MEAL_WINDOWS[0];
}

function splitItems(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function getRelevantMealMenu(now: {
  ymd: string;
  hm: string;
}): Promise<MealMenu> {
  const window = mealWindowFor(now.hm);
  const date = new Date(`${now.ymd}T00:00:00.000Z`);
  const college = await db.college.findUnique({
    where: { slug: "iimk" },
    select: { id: true },
  });

  if (college) {
    const menu = await db.messMenu.findFirst({
      where: {
        collegeId: college.id,
        meal: window.meal,
        OR: [
          { date },
          { date: null, dayOfWeek: dayOfWeek(now.ymd) },
          { date: null, dayOfWeek: null }, // generic daily menu fallback
        ],
      },
      orderBy: [{ date: "desc" }, { dayOfWeek: "desc" }, { updatedAt: "desc" }],
    });

    const items = splitItems(menu?.items);
    if (items.length > 0) {
      return {
        ...window,
        startsAt: menu?.startsAt ?? window.startsAt,
        endsAt: menu?.endsAt ?? window.endsAt,
        items,
        source: "database",
      };
    }
  }

  return {
    ...window,
    items: ["Menu not loaded yet"],
    source: "placeholder",
  };
}

export interface ShuttleTripView {
  id: string;
  sequence: number;
  departTime: string;
  fromStop: string;
  toStop: string;
  finalStop: string | null;
  extendedToMainGate: boolean;
}

async function collegeId(): Promise<string | null> {
  const college = await db.college.findUnique({
    where: { slug: "iimk" },
    select: { id: true },
  });
  return college?.id ?? null;
}

export async function getShuttleSchedule(): Promise<ShuttleTripView[]> {
  const id = await collegeId();
  if (!id) return [];
  return db.shuttleTrip.findMany({
    where: { collegeId: id },
    orderBy: { sequence: "asc" },
    select: {
      id: true,
      sequence: true,
      departTime: true,
      fromStop: true,
      toStop: true,
      finalStop: true,
      extendedToMainGate: true,
    },
  });
}

/** The next few shuttle departures relative to the current campus time. */
export async function getNextShuttles(
  now: { hm: string },
  limit = 3,
): Promise<ShuttleTripView[]> {
  const all = await getShuttleSchedule();
  const upcoming = all.filter((t) => t.departTime >= now.hm);
  // Wrap to start of day if nothing left today.
  const list = upcoming.length > 0 ? upcoming : all;
  return list.slice(0, limit);
}

export async function getCampusEssentials(): Promise<CampusEssentialItem[]> {
  const college = await db.college.findUnique({
    where: { slug: "iimk" },
    select: { id: true },
  });
  if (!college) return [];

  return db.campusEssential.findMany({
    where: { collegeId: college.id, isActive: true },
    select: {
      id: true,
      kind: true,
      title: true,
      description: true,
      href: true,
      phone: true,
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
}
