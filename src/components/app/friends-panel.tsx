"use client";

import { Check, Copy, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { FriendSummary } from "@/lib/friends";

export function FriendsPanel({
  friendCode,
  initialFriends,
}: {
  friendCode: string | null;
  initialFriends: FriendSummary[];
}) {
  const [myCode, setMyCode] = useState(friendCode);
  const [code, setCode] = useState("");
  const [friends, setFriends] = useState(initialFriends);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyCode() {
    if (!myCode) return;
    await navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  async function generateCode() {
    setGeneratingCode(true);
    setError(null);
    try {
      const res = await fetch("/api/friends/code", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate code.");
      setMyCode(data.friendCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate code.");
    } finally {
      setGeneratingCode(false);
    }
  }

  async function addFriend() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add friend.");
      setFriends((prev) => [
        ...prev,
        {
          id: data.friend.id,
          name: data.friend.name ?? data.friend.email.split("@")[0],
          email: data.friend.email,
          statusNow: "free",
          currentClass: null,
        },
      ]);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add friend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-primary/8 p-5">
        <p className="text-sm font-semibold">Your friend code</p>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-background/80 px-4 py-3">
          <span className="font-mono text-xl font-bold tracking-[0.18em]">
            {myCode ?? "Not generated"}
          </span>
          {myCode ? (
            <Button type="button" size="sm" variant="outline" onClick={() => void copyCode()}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void generateCode()}
              disabled={generatingCode}
            >
              {generatingCode ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Generate
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Generate once, then share it with classmates so they can compare schedules
          with you.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold">Add a friend</p>
        <div className="mt-3 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter friend code"
            className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm font-mono uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="button" onClick={() => void addFriend()} disabled={loading || code.length < 6}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            Add
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Friends</h2>
            <p className="text-xs text-muted-foreground">
              Who is free, who is trapped in class.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {friends.length} friend{friends.length === 1 ? "" : "s"}
          </span>
        </div>

        {friends.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-sm font-semibold">No friends yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your code. Become schedule-social.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/friends/${friend.id}`}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{friend.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {friend.email}
                    </p>
                  </div>
                  <span
                    className={
                      friend.statusNow === "free"
                        ? "rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success"
                        : "rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning-foreground"
                    }
                  >
                    {friend.statusNow === "free" ? "Free now" : "Busy now"}
                  </span>
                </div>
                {friend.currentClass ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    In class: {friend.currentClass}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
