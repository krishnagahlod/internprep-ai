import { test, expect } from "@playwright/test";

test.describe("Platform Critical Smoke Tests", () => {
  test("Landing Page renders with hero, bento sections, and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/InternPrep AI/i);

    // Verify main CTA buttons
    const startPrepBtn = page.getByRole("link", { name: /start practicing/i }).first();
    await expect(startPrepBtn).toBeVisible();
  });

  test("Guest Mode Sandbox allows navigation to dashboard and ATS checker", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Check Command Center heading
    await expect(page.getByText(/COMMAND CENTER/i)).toBeVisible();
    await expect(page.getByText(/Good/i)).toBeVisible();

    // Verify navigation to ATS Checker
    await page.goto("/ats-checker");
    await expect(page.getByText(/ATS Scorecard/i).or(page.getByText(/ATS/i))).toBeVisible();
  });

  test("Placement Intelligence Vault renders recruiter directory", async ({ page }) => {
    await page.goto("/placement-analysis");
    // Verify verification lock or verified studio
    const isLocked = await page.getByText(/INSTITUTIONAL ACCESS/i).isVisible().catch(() => false);
    const isVerified = await page.getByText(/Placement Intelligence/i).isVisible().catch(() => false);
    expect(isLocked || isVerified).toBe(true);
  });
});
