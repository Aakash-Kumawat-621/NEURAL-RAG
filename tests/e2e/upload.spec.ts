import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

test.describe("Upload Flow", () => {
  let testFilePath: string;

  test.beforeAll(() => {
    // Create a temporary test text file
    testFilePath = path.join(os.tmpdir(), "playwright_test_document.txt");
    fs.writeFileSync(testFilePath, "This is a simple text document used for automated E2E testing of the Agentic RAG upload pipeline.");
  });

  test.afterAll(() => {
    // Clean up
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  test("should allow a logged in user to upload a document", async ({ page }) => {
    // 1. Go to Login page
    await page.goto("/login");

    // 2. Sign up a new unique test user
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    await page.click("text=Sign up");
    await page.fill('input[type="text"]', "E2E Test User");
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', "password123");
    
    // We expect to navigate to /dashboard after signup
    await Promise.all([
      page.waitForURL("/dashboard"),
      page.click('button[type="submit"]')
    ]);

    // 3. We are now on the dashboard, look for "Upload New" button
    // It's hidden behind the input, the button itself opens the dialog
    // Playwright handles file inputs directly
    await page.setInputFiles('input[type="file"]', testFilePath);

    // 4. Wait for success toast
    const successToast = page.locator('text=Document uploaded successfully');
    await expect(successToast).toBeVisible({ timeout: 10000 });

    // 5. Verify it appears in the table
    const tableRow = page.locator('td', { hasText: "playwright_test_document.txt" });
    await expect(tableRow).toBeVisible();
  });
});
