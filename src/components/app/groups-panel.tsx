"use client";

import type { GroupKind } from "@prisma/client";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export interface GroupListItem {
  id: string;
  name: string;
  kind: GroupKind;
  count: number;
}

const KIND_OPTIONS: GroupKind[] = ["CLUB", "COMMITTEE", "SPORT", "FRIENDS", "CUSTOM"];

export function GroupsPanel({ initialGroups }: { initialGroups: GroupListItem[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GroupKind>("CUSTOM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createGroup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create group.");
      setGroups((prev) => [{ ...data.group, count: 1 }, ...prev]);
      setName("");
      setKind("CUSTOM");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold">Create a group</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Clubs, committees, sport teams, interest groups — schedule chaos, sorted.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Consulting club, football team..."
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as GroupKind)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {KIND_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          className="mt-3 w-full"
          onClick={() => void createGroup()}
          disabled={loading || name.trim().length < 2}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Create group
        </Button>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Your groups</h2>
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-sm font-semibold">No groups yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create one for your next club meeting.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{group.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {group.kind.toLowerCase()} · {group.count} member{group.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    Matrix
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
