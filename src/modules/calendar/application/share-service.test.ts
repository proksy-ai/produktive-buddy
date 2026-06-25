import { describe, expect, it } from "vitest";

import {
  isShareExpired,
  shareExpiresAt,
} from "@/modules/calendar/application/share-service";

describe("calendar share expiry", () => {
  it("treats revoked shares as expired", () => {
    const revokedAt = new Date("2026-01-10T08:00:00.000Z");
    expect(
      isShareExpired(
        {
          scope: "CUSTOM",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          endsOn: null,
          revokedAt,
        },
        new Date("2026-01-10T08:00:01.000Z"),
      ),
    ).toBe(true);
    expect(
      shareExpiresAt({
        scope: "CUSTOM",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        endsOn: null,
        revokedAt,
      })?.toISOString(),
    ).toBe(revokedAt.toISOString());
  });

  it("expires bounded shares after end-of-day boundary", () => {
    const share = {
      scope: "DAY" as const,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      endsOn: new Date("2026-01-05T00:00:00.000Z"),
      revokedAt: null,
    };
    expect(isShareExpired(share, new Date("2026-01-05T23:59:59.000Z"))).toBe(false);
    expect(isShareExpired(share, new Date("2026-01-06T00:00:00.000Z"))).toBe(true);
  });

  it("expires all-time shares after default ttl", () => {
    const share = {
      scope: "ALL_TIME" as const,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      endsOn: null,
      revokedAt: null,
    };
    expect(isShareExpired(share, new Date("2026-01-29T00:00:00.000Z"))).toBe(false);
    expect(isShareExpired(share, new Date("2026-02-01T00:00:00.000Z"))).toBe(true);
  });
});
