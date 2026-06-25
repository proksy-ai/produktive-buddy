import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  checkRateLimit,
  RateLimitError,
  requestIp,
} from "@/server/security/rate-limit";

describe("rate-limit", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  beforeAll(() => {
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    if (originalRedisUrl) process.env.REDIS_URL = originalRedisUrl;
  });

  it("enforces local rate limits", async () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    await checkRateLimit({ key, limit: 2, windowMs: 5_000 });
    await checkRateLimit({ key, limit: 2, windowMs: 5_000 });
    await expect(
      checkRateLimit({ key, limit: 2, windowMs: 5_000 }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("extracts client ip from x-forwarded-for", () => {
    const request = new Request("https://app.example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.9, 34.96.0.1",
      },
    });
    expect(requestIp(request)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip when forwarded value is invalid", () => {
    const request = new Request("https://app.example.com", {
      headers: {
        "x-forwarded-for": "not-an-ip",
        "x-real-ip": "198.51.100.7",
      },
    });
    expect(requestIp(request)).toBe("198.51.100.7");
  });
});
