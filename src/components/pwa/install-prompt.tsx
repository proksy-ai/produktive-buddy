"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeStandalone(onChange: () => void) {
  const mql = window.matchMedia(STANDALONE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getStandalone() {
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    // iOS Safari exposes this non-standard flag when installed.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const noopSubscribe = () => () => {};

function getIsIOS() {
  return (
    /ipad|iphone|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
    !("MSStream" in window)
  );
}

/**
 * Cross-platform "add to home screen" helper:
 * - Android/desktop Chromium: uses the native beforeinstallprompt event.
 * - iOS/iPadOS Safari: shows manual Share -> Add to Home Screen instructions.
 * Hidden entirely when the app is already installed (standalone display mode).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  // Server snapshot = "installed" so nothing flashes during SSR/hydration.
  const standalone = useSyncExternalStore(
    subscribeStandalone,
    getStandalone,
    () => true,
  );
  const isIOS = useSyncExternalStore(noopSubscribe, getIsIOS, () => false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone) return null;

  if (deferred) {
    return (
      <Card className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Install the app</p>
          <p className="text-xs text-muted-foreground">
            Add to your home screen for quick, full-screen access.
          </p>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
          }}
        >
          <Download className="size-4" />
          Install
        </Button>
      </Card>
    );
  }

  if (isIOS) {
    return (
      <Card className="p-4">
        <p className="text-sm font-medium">Add to Home Screen</p>
        <p className="mt-1 inline-flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          Tap the Share icon
          <Share className="inline size-3.5" />
          then &ldquo;Add to Home Screen&rdquo; to install.
        </p>
      </Card>
    );
  }

  return null;
}
