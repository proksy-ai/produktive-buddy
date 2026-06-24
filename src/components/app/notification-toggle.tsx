"use client";

import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "loading" | "unsupported" | "off" | "on" | "denied";

export function NotificationToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Missing VAPID public key");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      setState("on");
    } catch {
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      // keep current state
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    try {
      await fetch("/api/push/test", { method: "POST" });
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported") return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {state === "on" ? (
            <Bell className="size-5" />
          ) : (
            <BellOff className="size-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Class alerts</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {state === "denied"
              ? "Notifications are blocked in your browser settings. Flip them back on to get alerts."
              : state === "on"
                ? "You're set. We'll ping you the second a class is cancelled or moved."
                : "Get a heads-up when a class is cancelled, rescheduled, or a new term drops."}
          </p>
        </div>
      </div>

      {state !== "denied" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {state === "on" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void disable()}
                disabled={busy}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <BellOff className="size-4" />}
                Turn off
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void sendTest()}
                disabled={busy}
              >
                <Send className="size-4" />
                Send test
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => void enable()} disabled={busy || state === "loading"}>
              {busy || state === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Bell className="size-4" />
              )}
              Turn on alerts
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
