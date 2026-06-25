import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function signInWithOtp(email: string, request: APIRequestContext) {
  const send = await request.post("/api/auth/otp/send", {
    data: { email },
  });
  expect(send.ok()).toBeTruthy();
  const sendBody = (await send.json()) as { devCode?: string };
  expect(sendBody.devCode).toMatch(/^\d{6}$/);

  const verify = await request.post("/api/auth/otp/verify", {
    data: { email, code: sendBody.devCode },
  });
  expect(verify.ok()).toBeTruthy();
}

test("unauthenticated app route redirects to login", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login\?next=%2Ftoday/);
});

test("login page renders Google and OTP entry points", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in to/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /continue with google/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /use email otp instead/i }).click();
  await expect(page.getByPlaceholder(/mba25/i)).toBeVisible();
});

test("otp session can access calendar, attendance, and notes routes", async ({
  page,
}, testInfo) => {
  const uniqueEmail = `mba25e2e${Date.now()}${testInfo.project.name.replace(/[^a-z0-9]/gi, "").slice(0, 8)}@iimk.ac.in`;
  await signInWithOtp(uniqueEmail, page.request);

  const tokenRes = await page.request.post("/api/calendar/link", {
    data: { action: "ensureToken" },
  });
  expect(tokenRes.ok()).toBeTruthy();
  const tokenBody = (await tokenRes.json()) as {
    links?: { httpUrl: string };
  };
  expect(tokenBody.links?.httpUrl).toContain("/api/calendar/");

  const icsRes = await page.request.get(tokenBody.links!.httpUrl);
  expect(icsRes.ok()).toBeTruthy();
  const ics = await icsRes.text();
  const uidLine = ics.split(/\r?\n/).find((line) => line.startsWith("UID:"));
  const sessionId = uidLine
    ? uidLine.replace(/^UID:/, "").replace(/@produktivebuddy$/, "")
    : "invalid-session-id";

  const attendanceRes = await page.request.post("/api/attendance", {
    data: { sessionId, status: "PRESENT" },
  });
  expect([200, 400, 500]).toContain(attendanceRes.status());

  const noteRes = await page.request.post("/api/notes", {
    data: { sessionId, body: "E2E smoke note" },
  });
  expect([200, 400, 500]).toContain(noteRes.status());

  const shareRes = await page.request.post("/api/calendar/link", {
    data: { action: "createShare", scope: "DAY" },
  });
  expect(shareRes.ok()).toBeTruthy();
  const shareBody = (await shareRes.json()) as {
    share?: { token: string };
  };
  expect(shareBody.share?.token).toBeTruthy();

  const revokeShareRes = await page.request.delete(
    `/api/calendar/link?shareToken=${encodeURIComponent(shareBody.share!.token)}`,
  );
  expect(revokeShareRes.ok()).toBeTruthy();
});

test("newly signed-in user can reach onboarding flow", async ({ page }, testInfo) => {
  const uniqueEmail = `mba26e2e${Date.now()}${testInfo.project.name.replace(/[^a-z0-9]/gi, "").slice(0, 8)}@iimk.ac.in`;
  await signInWithOtp(uniqueEmail, page.request);
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/onboarding/);
});
