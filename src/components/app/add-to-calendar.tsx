"use client";

import { CalendarPlus, Check, Copy, Download, Loader2, RefreshCw, ShieldOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type CalendarLinks = {
  httpUrl: string;
  webcalUrl: string;
  appleUrl: string;
  googleUrl: string;
  calendarPreference?: "GOOGLE" | "APPLE" | "BOTH" | "LATER";
};
type ShareScope = "DAY" | "WEEK" | "ALL_TIME" | "CUSTOM";

export function AddToCalendar() {
  const [links, setLinks] = useState<CalendarLinks | null>(null);
  const [shareLinks, setShareLinks] = useState<CalendarLinks | null>(null);
  const [scope, setScope] = useState<ShareScope>("DAY");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  async function ensureLinks() {
    if (links) return links;
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/link");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLinks(data);
      return data as CalendarLinks;
    } finally {
      setLoading(false);
    }
  }

  async function subscribe() {
    const l = await ensureLinks();
    if (!l) return;
    if (l.calendarPreference === "GOOGLE") window.location.href = l.googleUrl;
    else window.location.href = l.appleUrl;
  }

  async function copy() {
    const l = await ensureLinks();
    if (l) {
      await navigator.clipboard.writeText(l.httpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  async function download() {
    const l = await ensureLinks();
    if (l) window.open(l.httpUrl, "_blank");
  }

  async function rotate() {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/link", { method: "POST" });
      if (!res.ok) throw new Error();
      setLinks(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function createShareLink() {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          ...(scope === "CUSTOM" ? { startsOn, endsOn } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      setShareLinks(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function copyShareLink() {
    if (!shareLinks) return;
    await navigator.clipboard.writeText(shareLinks.httpUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1800);
  }

  async function revoke() {
    setLoading(true);
    try {
      await fetch("/api/calendar/link", { method: "DELETE" });
      setLinks(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarPlus className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Add to your calendar</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sync your timetable to Apple or Google Calendar. It auto-updates when
            classes change.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void subscribe()} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CalendarPlus className="size-4" />
          )}
          Subscribe
        </Button>
        <Button size="sm" variant="outline" onClick={() => void copy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void ensureLinks().then((l) => window.open(l.googleUrl, "_blank"))}
        >
          Google
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void ensureLinks().then((l) => { window.location.href = l.appleUrl; })}
        >
          Apple
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((open) => !open)}
        className="mt-4 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {advancedOpen ? "Hide advanced controls" : "Advanced calendar controls"}
      </button>
      {advancedOpen ? (
        <div className="mt-3 rounded-2xl border border-border bg-muted/30 p-3">
        <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => void download()}>
          <Download className="size-4" />
          Download .ics
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void rotate()} disabled={loading}>
          <RefreshCw className="size-4" />
          Rotate
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void revoke()} disabled={loading}>
          <ShieldOff className="size-4" />
          Revoke
        </Button>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
        <p className="text-sm font-semibold">Share a calendar slice</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick what someone can see: one day, this week, all time, or a custom
          range.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SCOPES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setScope(item.value)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                scope === item.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {scope === "CUSTOM" ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              aria-label="Calendar share start date"
            />
            <input
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              aria-label="Calendar share end date"
            />
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void createShareLink()}
            disabled={loading || (scope === "CUSTOM" && (!startsOn || !endsOn))}
          >
            Create share link
          </Button>
          {shareLinks ? (
            <Button size="sm" variant="ghost" onClick={() => void copyShareLink()}>
              {shareCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {shareCopied ? "Copied" : "Copy share link"}
            </Button>
          ) : null}
        </div>
      </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Calendar links are private bearer links. Rotate or revoke if you ever
          share one by mistake.
        </p>
        </div>
      ) : null}
    </div>
  );
}

const SCOPES: { value: ShareScope; label: string }[] = [
  { value: "DAY", label: "One day" },
  { value: "WEEK", label: "This week" },
  { value: "ALL_TIME", label: "All time" },
  { value: "CUSTOM", label: "Custom" },
];
