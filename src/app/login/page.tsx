"use client";

import { ChevronDown, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { safeNextPath } from "@/lib/auth/redirect";
import { BRAND } from "@/lib/brand";

type Step = "email" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [next] = useState(() => {
    if (typeof window === "undefined") return "/today";
    return safeNextPath(new URLSearchParams(window.location.search).get("next"));
  });

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [batchLabel, setBatchLabel] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("error");
  });
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  function continueWithGoogle() {
    const url = new URL("/api/auth/google", window.location.origin);
    url.searchParams.set("next", next);
    window.location.href = url.toString();
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");
      setBatchLabel(data.batchLabel ?? null);
      setDevCode(data.devCode ?? null);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 pb-safe pt-safe">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          {BRAND.shortName.charAt(0)}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in to {BRAND.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your IIMK Google Workspace account
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-3">
            <Button type="button" className="w-full" onClick={continueWithGoogle}>
              Continue with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              We only read your verified name and @iimk.ac.in email.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setShowOtp((value) => !value)}
          >
            Use email OTP instead
            <ChevronDown
              className={`size-4 transition-transform ${showOtp ? "rotate-180" : ""}`}
            />
          </button>

          {showOtp && step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Institute email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="mba25you@iimk.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-lg border border-input bg-background pr-3 pl-10 text-sm outline-none ring-ring focus-visible:ring-2"
                  />
                </div>
              </label>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Send verification code"
                )}
              </Button>
            </form>
          ) : showOtp ? (
            <form onSubmit={verifyCode} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Code sent to{" "}
                <span className="font-medium text-foreground">{email}</span>
                {batchLabel ? (
                  <>
                    {" "}
                    · batch{" "}
                    <span className="font-medium text-foreground">
                      {batchLabel}
                    </span>
                  </>
                ) : null}
              </p>
              {devCode && (
                <p className="rounded-lg bg-muted px-3 py-2 text-center font-mono text-sm">
                  Dev code: {devCode}
                </p>
              )}
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">6-digit code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-center font-mono text-lg tracking-[0.3em] outline-none ring-ring focus-visible:ring-2"
                />
              </label>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Verify and continue"
                )}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
              >
                Use a different email
              </button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
