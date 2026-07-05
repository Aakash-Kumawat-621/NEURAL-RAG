import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should render the login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("should show error on invalid login", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "fake@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Wait for the sonner toast to appear
    await expect(page.locator("text=Invalid email or password")).toBeVisible({ timeout: 5000 });
  });

  test("should navigate to signup from login", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Sign up");
    await expect(page).toHaveURL("/signup");
    await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
  });
});
