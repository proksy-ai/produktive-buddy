import { describe, expect, it } from "vitest";

import { assertSameOrigin } from "@/server/security/csrf";

describe("assertSameOrigin", () => {
  it("allows requests without origin header", async () => {
    const request = new Request("https://app.example.com/api/test", {
      method: "POST",
    });
    expect(assertSameOrigin(request)).toBeNull();
  });

  it("allows matching origin and host", async () => {
    const request = new Request("https://app.example.com/api/test", {
      method: "POST",
      headers: {
        origin: "https://app.example.com",
        host: "app.example.com",
      },
    });
    expect(assertSameOrigin(request)).toBeNull();
  });

  it("rejects mismatched origin", async () => {
    const request = new Request("https://app.example.com/api/test", {
      method: "POST",
      headers: {
        origin: "https://evil.example.com",
        host: "app.example.com",
      },
    });

    const response = assertSameOrigin(request);
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      error: "Invalid request origin.",
    });
  });
});
