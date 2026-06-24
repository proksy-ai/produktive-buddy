"use client";

import { CalendarPlus, Check, Copy, Download, Loader2, RefreshCw, ShieldOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AddToCalendar() {
  const [links, setLinks] = useState<{ httpUrl: string; webcalUrl: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function ensureLinks() {
    if (links) return links;
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/link");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLinks(data);
      return data as { httpUrl: string; webcalUrl: string };
    } finally {
      setLoading(false);
    }
  }

  async function subscribe() {
    const l = await ensureLinks();
    if (l) window.location.href = l.webcalUrl;
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
      <p className="mt-3 text-xs text-muted-foreground">
        Calendar links are private bearer links. Rotate or revoke if you ever share
        one by mistake.
      </p>
    </div>
  );
}
