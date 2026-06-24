import webpush from "web-push";

import { db } from "@/lib/db";

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:dev@kairo.app",
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Send a notification to every device a user has registered. */
export async function sendToUser(
  userId: string,
  payload: PushPayload,
): Promise<number> {
  if (!configure()) {
    console.warn("[push] VAPID keys not configured; skipping send.");
    return 0;
  }

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
        sent++;
      } catch (err: unknown) {
        const status =
          typeof err === "object" && err && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        // Stale/expired subscription — clean it up.
        if (status === 404 || status === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("[push] send failed:", err);
        }
      }
    }),
  );

  return sent;
}

export async function sendToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<number> {
  let total = 0;
  for (const id of userIds) {
    total += await sendToUser(id, payload);
  }
  return total;
}
