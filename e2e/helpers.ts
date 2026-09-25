import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { DEMO_PASSWORD } from "../src/api/auth";
import { content } from "../src/content";
import { addDaysISO, todayISO } from "../src/lib/dates";

/** An ISO date N days from today in Manila time, the same clock the site uses. */
export const dateFromToday = (days: number): string => addDaysISO(todayISO(), days);

/** Opens a page and waits until the browser has finished loading its scripts and data. */
export async function visit(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/** The demo staff login. Everyone who signs in is an admin, so there is only one to pick. */
export const demoAccount = () => content.admin.login.demo.accounts[0];

/** Signs in through the real login form. */
export async function loginAs(page: Page, from = "/admin/login"): Promise<void> {
  await visit(page, from);
  await page.getByLabel(content.admin.login.email).fill(demoAccount().email);
  await page.getByLabel(content.admin.login.password).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: content.admin.login.submit }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login");
  await page.waitForLoadState("networkidle");
}

/**
 * Error and warning messages inside the page's main content. Next.js also keeps its own
 * hidden "alert" for announcing page changes, so plain getByRole("alert") counts one too many.
 */
export const pageAlerts = (page: Page) => page.getByRole("main").getByRole("alert");

/**
 * Runs the axe accessibility checker on the current page and fails with a readable list
 * of problems. Covers WCAG 2.0/2.1/2.2 A and AA plus axe's best-practice rules.
 */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();

  const problems = results.violations.map((violation) => {
    const where = violation.nodes
      .slice(0, 3)
      .map((node) => `    ${node.target.join(" ")}`)
      .join("\n");
    return `${violation.id} [${violation.impact}]: ${violation.help}\n${where}`;
  });

  expect(problems, `Accessibility problems on ${new URL(page.url()).pathname}`).toEqual([]);
}
