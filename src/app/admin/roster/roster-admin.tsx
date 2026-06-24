"use client";

import { Loader2, Send, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface Stats {
  total: number;
  invited: number;
  joined: number;
}

export function RosterAdmin({ initialStats }: { initialStats: Stats }) {
  const [csv, setCsv] = useState("");
  const [stats, setStats] = useState(initialStats);
  const [busy, setBusy] = useState<"import" | "invite" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshStats() {
    const res = await fetch("/api/admin/roster/stats");
    if (res.ok) setStats(await res.json());
  }

  async function doImport() {
    setBusy("import");
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/roster/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setMsg(`Imported ${data.imported} students (${data.parsed} rows parsed).`);
      setCsv("");
      await refreshStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(null);
    }
  }

  async function doInvite() {
    setBusy("invite");
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/roster/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onlyUninvited: true, limit: 100 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invite failed");
      setMsg(
        `Sent ${data.sent} invites${data.failed ? `, ${data.failed} failed` : ""}. ${data.remaining} still pending — run again to continue.`,
      );
      await refreshStats();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invite failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Imported" value={stats.total} />
        <Stat label="Invited" value={stats.invited} />
        <Stat label="Joined" value={stats.joined} />
      </div>

      <div className="rounded-md border-2 border-foreground bg-card p-4 shadow-nb">
        <p className="text-sm font-bold">Paste roster (CSV)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          One student per line. Header optional. Columns:{" "}
          <code>email, name, roll number, batch</code>. Only email is required.
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={10}
          placeholder={"email,name,roll number,batch\nmba25abc@iimk.ac.in,Asha R,PGP29-101,PGP29"}
          className="mt-3 w-full rounded-md border-2 border-foreground bg-background p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void doImport()} disabled={busy !== null || !csv.trim()}>
            {busy === "import" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Import students
          </Button>
          <Button
            variant="secondary"
            onClick={() => void doInvite()}
            disabled={busy !== null || stats.total === 0}
          >
            {busy === "invite" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send invites (batch of 100)
          </Button>
        </div>
        {msg ? <p className="mt-3 text-sm font-semibold text-success">{msg}</p> : null}
        {error ? (
          <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Invites send via your configured email provider. Run &ldquo;Send
        invites&rdquo; repeatedly to work through the full list in batches.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border-2 border-foreground bg-card p-4 text-center shadow-nb">
      <p className="text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
