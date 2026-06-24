"use client";

import { Bell, Lock, Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { OnboardingTerm } from "@/lib/onboarding";
import { voice } from "@/lib/voice";

export function LockedTermSheet({
  term,
  onClose,
  onNotifyChange,
}: {
  term: OnboardingTerm;
  onClose: () => void;
  onNotifyChange: (termId: string, requested: boolean) => void;
}) {
  const [notifyRequested, setNotifyRequested] = useState(term.notifyRequested);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleNotify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/notify-term", {
        method: notifyRequested ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termId: term.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? voice.termLocked.notifyError);
      const next = !notifyRequested;
      setNotifyRequested(next);
      onNotifyChange(term.id, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : voice.termLocked.notifyError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="locked-term-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Lock className="size-5 text-muted-foreground" />
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2 id="locked-term-title" className="text-lg font-semibold tracking-tight">
          {voice.termLocked.title(term.name)}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {voice.termLocked.body(term.name)}
        </p>

        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            className="w-full"
            variant={notifyRequested ? "outline" : "default"}
            disabled={loading}
            onClick={() => void toggleNotify()}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : notifyRequested ? (
              voice.termLocked.notifyDone
            ) : (
              <>
                <Bell className="size-4" />
                {voice.termLocked.notifyCta}
              </>
            )}
          </Button>
          {!notifyRequested && (
            <p className="text-center text-xs text-muted-foreground">
              {voice.termLocked.notifySub}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {voice.termLocked.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
