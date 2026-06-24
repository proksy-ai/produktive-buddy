"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function GroupMemberPanel({ groupId }: { groupId: string }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function add() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add member.");
      setMessage(`Added ${data.member.name ?? data.member.email}. Refresh to update matrix.`);
      setCode("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add member.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold">Add member</p>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Friend code"
          className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm font-mono uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="button" onClick={() => void add()} disabled={loading || code.length < 6}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          Add
        </Button>
      </div>
      {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
