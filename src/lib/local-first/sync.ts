"use client";

import {
  markAttendanceDraftSynced,
  markNoteDraftSynced,
  pendingAttendanceDrafts,
  pendingNoteDrafts,
  type AttendanceDraftStatus,
} from "@/lib/local-first/store";

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Sync failed: ${path} (${response.status})`);
  }
}

export async function syncAttendanceDraft(
  sessionId: string,
  status: AttendanceDraftStatus,
) {
  try {
    await postJson("/api/attendance", { sessionId, status });
    await markAttendanceDraftSynced(sessionId, status);
    return true;
  } catch {
    return false;
  }
}

export async function syncNoteDraft(sessionId: string, body: string) {
  try {
    await postJson("/api/notes", { sessionId, body });
    await markNoteDraftSynced(sessionId, body);
    return true;
  } catch {
    return false;
  }
}

export async function flushPendingLocalDrafts() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  const [attendance, notes] = await Promise.all([
    pendingAttendanceDrafts(),
    pendingNoteDrafts(),
  ]);

  for (const draft of attendance) {
    await syncAttendanceDraft(draft.sessionId, draft.status);
  }
  for (const draft of notes) {
    await syncNoteDraft(draft.sessionId, draft.body);
  }
}
