import { randomBytes } from "node:crypto";

import type { CalendarShareScope } from "@prisma/client";

import { db } from "@/lib/db";

function token() {
  return randomBytes(24).toString("base64url");
}

function dateAtUtcMidnight(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function defaultRange(scope: CalendarShareScope) {
  const today = dateAtUtcMidnight(todayYmd());
  if (scope === "DAY") {
    return { startsOn: today, endsOn: today };
  }
  if (scope === "WEEK") {
    const start = new Date(today);
    const dow = (start.getUTCDay() + 6) % 7;
    start.setUTCDate(start.getUTCDate() - dow);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    return { startsOn: start, endsOn: end };
  }
  return { startsOn: null, endsOn: null };
}

function daysMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

const DEFAULT_SHARE_TTL_DAYS = Number(process.env.CALENDAR_SHARE_TTL_DAYS ?? "30");

export function calendarLinks(origin: string, tokenValue: string) {
  const httpUrl = `${origin}/api/calendar/${tokenValue}.ics`;
  const webcalUrl = httpUrl.replace(/^https?:/, "webcal:");
  return {
    httpUrl,
    webcalUrl,
    appleUrl: webcalUrl,
    googleUrl: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpUrl)}`,
  };
}

export interface CalendarShareView {
  token: string;
  scope: CalendarShareScope;
  startsOn: Date | null;
  endsOn: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  links: ReturnType<typeof calendarLinks>;
}

interface CalendarShareLike {
  scope: CalendarShareScope;
  createdAt: Date;
  endsOn: Date | null;
  revokedAt: Date | null;
}

export function shareExpiresAt(share: CalendarShareLike): Date | null {
  if (share.revokedAt) return share.revokedAt;
  if (share.endsOn) {
    // endsOn is stored at UTC midnight; expire after the full day passes.
    return new Date(share.endsOn.getTime() + daysMs(1));
  }
  if (share.scope === "ALL_TIME" && DEFAULT_SHARE_TTL_DAYS > 0) {
    return new Date(share.createdAt.getTime() + daysMs(DEFAULT_SHARE_TTL_DAYS));
  }
  return null;
}

export function isShareExpired(share: CalendarShareLike, now = new Date()): boolean {
  const expiresAt = shareExpiresAt(share);
  return expiresAt ? now >= expiresAt : false;
}

export async function listActiveCalendarShares(userId: string, origin: string) {
  const shares = await db.calendarShare.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      token: true,
      scope: true,
      startsOn: true,
      endsOn: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  return shares
    .filter((share) => !isShareExpired(share))
    .map(
      (share): CalendarShareView => ({
        token: share.token,
        scope: share.scope,
        startsOn: share.startsOn,
        endsOn: share.endsOn,
        createdAt: share.createdAt,
        expiresAt: shareExpiresAt(share),
        links: calendarLinks(origin, share.token),
      }),
    );
}

export async function ensureCalendarToken(userId: string) {
  const current = await db.user.findUnique({
    where: { id: userId },
    select: { calendarToken: true, calendarPreference: true },
  });

  if (current?.calendarToken) return current;

  return db.user.update({
    where: { id: userId },
    data: { calendarToken: token() },
    select: { calendarToken: true, calendarPreference: true },
  });
}

export async function rotateCalendarToken(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { calendarToken: token() },
    select: { calendarToken: true, calendarPreference: true },
  });
}

export async function revokeCalendarToken(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { calendarToken: null },
    select: { id: true },
  });
}

export async function createCalendarShare(input: {
  userId: string;
  scope: CalendarShareScope;
  startsOn?: string;
  endsOn?: string;
}) {
  const fallback = defaultRange(input.scope);
  const startsOn = input.startsOn
    ? dateAtUtcMidnight(input.startsOn)
    : fallback.startsOn;
  const endsOn = input.endsOn ? dateAtUtcMidnight(input.endsOn) : fallback.endsOn;

  if (startsOn && endsOn && startsOn > endsOn) {
    throw new Error("Share start date must be before end date.");
  }

  return db.calendarShare.create({
    data: {
      userId: input.userId,
      token: token(),
      scope: input.scope,
      startsOn,
      endsOn,
    },
    select: {
      token: true,
      scope: true,
      startsOn: true,
      endsOn: true,
      createdAt: true,
      revokedAt: true,
    },
  });
}

export async function revokeCalendarShare(userId: string, shareToken: string) {
  const updated = await db.calendarShare.updateMany({
    where: {
      userId,
      token: shareToken,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
  return updated.count > 0;
}
