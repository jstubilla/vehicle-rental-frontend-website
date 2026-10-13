import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { SPLASH_MIN_MS } from "../src/lib/site";
import { expectNoA11yViolations, visit } from "./helpers";

/** The loading screen inside the page (not the full-screen one that covers a fresh load). */
const LOADING_SELECTOR = `[role="status"][aria-label="${content.loadingScreen.label}"]:not([data-splash])`;
const loading = (page: Page) => page.locator(LOADING_SELECTOR);
const splash = (page: Page) => page.locator("[data-splash]");
/** The animated logo. Only visible when the visitor has not asked for reduced motion. Matches
 *  whichever theme's pair is showing (light or dark is the site's default), since these tests
 *  aren't about theming. */
const animation = (scope: ReturnType<typeof loading>) =>
  scope.locator('img[src="/images/loading.gif"]:visible, img[src="/images/loading-dark.gif"]:visible');
/** The still frame shown instead when the visitor has asked for reduced motion. */
const stillFrame = (scope: ReturnType<typeof loading>) =>
  scope.locator('img[src="/images/loading-static.png"]:visible, img[src="/images/loading-dark-static.png"]:visible');

/**
 * The loading screen used inside the page (while moving between pages) is shown on the developer-only
 * styleguide page too. It is checked there because a real page move is over too fast to look at reliably.
 */
test("the loading screen renders the animation and the credit, as a status with a 'Loading' label", async ({ page }) => {
  await visit(page, "/styleguide");
  await expect(splash(page)).toHaveCount(0, { timeout: 15_000 });
  const screen = loading(page);
  await expect(screen).toBeVisible();
  await expect(animation(screen)).toBeVisible();
  await expect(screen).toContainText(content.footer.credit);
  await expect(screen).toHaveAttribute("role", "status");
});

test("a visitor who asks for reduced motion sees the still frame instead of the animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit(page, "/styleguide");
  await expect(splash(page)).toHaveCount(0, { timeout: 15_000 });
  const screen = loading(page);
  await expect(stillFrame(screen)).toBeVisible();
  await expect(animation(screen)).toBeHidden();
});

for (const theme of ["light", "dark"] as const) {
  test(`the loading screen has no accessibility problems in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((chosen) => {
      if (!localStorage.getItem("car-rental-theme")) localStorage.setItem("car-rental-theme", chosen);
    }, theme);
    await visit(page, "/styleguide");
    await expect(splash(page)).toHaveCount(0, { timeout: 15_000 });
    await expect(loading(page)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    // Just this screen: the developer-only styleguide page has its own, older, accessibility gaps.
    await expectNoA11yViolations(page, ["region"], LOADING_SELECTOR);
  });
}

/** The screen shown on every full page load or refresh. */

test.describe("the screen shown on every refresh", () => {
  test("shows the animation and 'Powered by VAIANI' on a fresh load, for at least the minimum time, then leaves", async ({
    page,
  }) => {
    const started = Date.now();
    await page.goto("/", { waitUntil: "commit" });
    await expect(splash(page)).toBeVisible();
    await expect(splash(page)).toContainText(content.footer.credit);
    await expect(animation(splash(page))).toBeVisible();

    await expect(splash(page)).toHaveCount(0, { timeout: 15_000 });
    expect(Date.now() - started).toBeGreaterThanOrEqual(SPLASH_MIN_MS - 300);
    await expect(page.getByRole("heading", { level: 1, name: content.home.hero.title })).toBeVisible();
  });

  test("comes back on every refresh, but not when moving between pages", async ({ page }) => {
    await visit(page, "/");
    await expect(splash(page)).toHaveCount(0, { timeout: 15_000 });

    await page.reload({ waitUntil: "commit" });
    await expect(splash(page)).toBeVisible();
    await expect(splash(page)).toHaveCount(0, { timeout: 15_000 });

    await page.getByRole("banner").getByRole("link", { name: "Vehicles" }).click();
    await expect(page).toHaveURL(/\/vehicles/);
    await expect(splash(page)).toHaveCount(0);
  });

  test("is only on the public site, not the admin area", async ({ page }) => {
    await visit(page, "/admin/login");
    await expect(page.getByRole("heading", { level: 1, name: content.admin.login.title })).toBeVisible();
    await expect(splash(page)).toHaveCount(0);
    await expect(page.getByText(content.footer.credit)).toHaveCount(0);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`has no accessibility problems in ${theme} mode`, async ({ page }) => {
      await page.addInitScript((chosen) => {
        if (!localStorage.getItem("car-rental-theme")) localStorage.setItem("car-rental-theme", chosen);
      }, theme);
      await page.goto("/", { waitUntil: "commit" });
      await expect(splash(page)).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      // Same reason as above: a loading screen has no heading of its own.
      await expectNoA11yViolations(page, ["page-has-heading-one"]);
    });
  }
});
