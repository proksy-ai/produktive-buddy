import { createHash } from "node:crypto";

import type { AuditSeverity, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

function hashIp(ip: string | null): string | null {
  if (!ip || ip === "unknown") return null;
  return createHash("sha256")
    .update(`${process.env.AUTH_SECRET ?? "dev"}:${ip}`)
    .digest("hex");
}

export async function auditLog(input: {
  actorId?: string | null;
  action: string;
  resource?: string | null;
  metadata?: Prisma.InputJsonValue;
  severity?: AuditSeverity;
  request?: Request;
}) {
  await db.auditLog
    .create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        resource: input.resource ?? null,
        metadata: input.metadata ?? undefined,
        severity: input.severity ?? "INFO",
        ipHash: hashIp(
          input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            input.request?.headers.get("x-real-ip") ??
            null,
        ),
        userAgent: input.request?.headers.get("user-agent") ?? null,
      },
    })
    .catch((err) => {
      // Audit logging must never take down the request path.
      console.error("[audit]", err);
    });
}
