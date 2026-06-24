"use client";

import { Download, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { BRAND } from "@/lib/brand";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform =
  | "ios"
  | "ipad"
  | "android-chromium"
  | "android-other"
  | "desktop-chromium"
  | "desktop-safari"
  | "desktop-other";

const DISMISS_KEY = "pb-install-guide-dismissed-v1";

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  const isTouchMac =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isIPhone = /iphone|ipod/.test(ua);
  const isIPad = /ipad/.test(ua) || isTouchMac;
  const isAndroid = /android/.test(ua);
  const isChromium = /chrome|crios|edg|edga|brave|opr/.test(ua);
  const isSafari = /safari/.test(ua) && !isChromium;

  if (isIPhone) return "ios";
  if (isIPad) return "ipad";
  if (isAndroid) return isChromium ? "android-chromium" : "android-other";
  if (isChromium) return "desktop-chromium";
  if (isSafari) return "desktop-safari";
  return "desktop-other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * One-time, device-aware "use this like an app" popup. Shows tailored
 * instructions (or a native install button when the browser supports it) so
 * students can keep Produktive Buddy on their home screen / dock.
 */
export function InstallGuide() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop-other");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Slight delay so it doesn't fight the first paint (and keeps setState out
    // of the synchronous effect body).
    const t = setTimeout(() => {
      setPlatform(detectPlatform());
      setOpen(true);
    }, 1200);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  }

  async function nativeInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!open) return null;

  const guide = guideFor(platform);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
      />
      <div className="animate-slide-up relative w-full max-w-sm rounded-md border-2 border-foreground bg-card p-5 shadow-nb-lg">
        <button
          type="button"
          aria-label="Close"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-md border-2 border-foreground bg-card p-1 shadow-nb-sm"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md border-2 border-foreground bg-accent text-lg font-extrabold text-accent-foreground shadow-nb-sm">
            {BRAND.shortName.charAt(0)}
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              Use it like an app
            </p>
            <h2 className="text-lg font-extrabold leading-tight">{guide.title}</h2>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{guide.intro}</p>

        {deferred ? (
          <button
            type="button"
            onClick={() => void nativeInstall()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border-2 border-foreground bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-nb active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Download className="size-4" />
            Install Produktive Buddy
          </button>
        ) : (
          <ol className="mt-4 space-y-2">
            {guide.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-md border-2 border-foreground bg-background p-3 text-sm font-medium"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-foreground bg-accent text-xs font-extrabold text-accent-foreground">
                  {i + 1}
                </span>
                <span className="flex flex-wrap items-center gap-1">{step}</span>
              </li>
            ))}
          </ol>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function guideFor(platform: Platform): {
  title: string;
  intro: string;
  steps: React.ReactNode[];
} {
  const share = <Share key="s" className="inline size-4" />;
  const plus = <SquarePlus key="p" className="inline size-4" />;
  switch (platform) {
    case "ios":
      return {
        title: "Add to your iPhone",
        intro: "Pin Produktive Buddy to your home screen for full-screen, app-like access.",
        steps: [
          <>Tap the Share button {share} in Safari&apos;s toolbar</>,
          <>Scroll and tap &ldquo;Add to Home Screen&rdquo; {plus}</>,
          <>Tap &ldquo;Add&rdquo; — open it from your home screen like any app</>,
        ],
      };
    case "ipad":
      return {
        title: "Add to your iPad",
        intro: "Keep Produktive Buddy one tap away on your iPad home screen.",
        steps: [
          <>Tap the Share button {share} in Safari (top bar)</>,
          <>Choose &ldquo;Add to Home Screen&rdquo; {plus}</>,
          <>Tap &ldquo;Add&rdquo; — it opens full-screen like an app</>,
        ],
      };
    case "android-other":
      return {
        title: "Add to your phone",
        intro: "Install Produktive Buddy from your browser menu for app-like access.",
        steps: [
          <>Open the browser menu (⋮)</>,
          <>Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</>,
          <>Confirm — launch it from your home screen</>,
        ],
      };
    case "desktop-safari":
      return {
        title: "Add to your Dock",
        intro: "Keep Produktive Buddy in your Mac Dock for quick access.",
        steps: [
          <>Click the Share button {share} in Safari</>,
          <>Choose &ldquo;Add to Dock&rdquo;</>,
          <>Launch it from the Dock like an app</>,
        ],
      };
    case "desktop-other":
      return {
        title: "Install on your computer",
        intro: "Use your browser&apos;s install option to keep Produktive Buddy as an app.",
        steps: [
          <>Open the browser menu</>,
          <>Look for &ldquo;Install&rdquo; or &ldquo;Add to Home screen&rdquo;</>,
          <>Confirm to add it as a desktop app</>,
        ],
      };
    // android-chromium / desktop-chromium fall back to the native button when
    // available; if not, give a sensible manual hint.
    default:
      return {
        title: "Install Produktive Buddy",
        intro: "Add it to your device for full-screen, app-like access.",
        steps: [
          <>Open your browser menu</>,
          <>Tap &ldquo;Install app&rdquo; / the install icon in the address bar</>,
          <>Confirm to add it to your home screen</>,
        ],
      };
  }
}
