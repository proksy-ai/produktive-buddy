"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Registers the service worker and surfaces an "update available" toast when a
 * new version is waiting. Tapping it activates the new SW and reloads, so an
 * installed shortcut never gets stuck on a stale build.
 */
export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const waitingRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    const promptUpdate = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        waitingRef.current = reg.waiting;
        setUpdateReady(true);
      }
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        promptUpdate(reg);
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              waitingRef.current = reg.waiting ?? installing;
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        /* registration failures are non-fatal */
      });
  }, []);

  const applyUpdate = useCallback(() => {
    waitingRef.current?.postMessage({ type: "SKIP_WAITING" });
    setUpdateReady(false);
  }, []);

  if (!updateReady) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-6">
      <button
        type="button"
        onClick={applyUpdate}
        className="animate-slide-up flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg"
      >
        <RefreshCw className="size-4" />
        Update available - tap to refresh
      </button>
    </div>
  );
}
