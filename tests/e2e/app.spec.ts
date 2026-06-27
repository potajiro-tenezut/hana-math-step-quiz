import { expect, test } from "@playwright/test";

test("starts all-range mode and displays a question", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "全範囲ランダム" }).click();
  await expect(page.getByText(/問 ・ ステップ/)).toBeVisible();
  await expect(page.getByRole("button").filter({ hasText: /○|×|✓/ })).toHaveCount(3);
});

test("unit selection works on mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "単元を選んで練習" }).click();
  await page.getByRole("button", { name: /2次方程式/ }).click();
  await expect(page.locator(".badge")).toContainText("2次方程式");
});

test("review mode can start after seeded history exists", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "hanaMathStepQuizHistory",
      JSON.stringify({
        totalSessions: 1,
        typeStats: {},
        timeoutCount: 0,
        averageResponseSeconds: 0,
        recentSessions: [],
        weakTypes: ["linear-basic"],
        reviewTypes: ["linear-basic"],
      }),
    );
  });
  await page.reload();
  await page.getByRole("button", { name: "間違えた問題を復習" }).click();
  await expect(page.locator(".badge")).toContainText("1次方程式");
});

test("base path used by GitHub Pages serves the app", async ({ page }) => {
  await page.goto("/hana-math-step-quiz/");
  await expect(page.getByRole("heading", { name: "Hana 数学ステップクイズ" })).toBeVisible();
});
