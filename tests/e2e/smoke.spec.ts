import { expect, test } from "@playwright/test";

test("unauthenticated app route redirects to login", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login\?next=%2Ftoday/);
});

test("login page renders OTP entry point", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in to/i })).toBeVisible();
  await expect(page.getByPlaceholder(/mba25/i)).toBeVisible();
});
