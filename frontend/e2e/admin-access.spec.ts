import { expect, test, type Page } from "./test";
import { DEMO_PASSWORD, fixtureId } from "./db";
import { content } from "../src/content";
import { demoAccount, loginAs, pageAlerts, visit } from "./helpers";

const t = content.admin;
const sidebar = (page: Page) => page.getByRole("navigation", { name: t.nav.label });

test.describe("signed out", () => {
  test("every admin page sends visitors to the login page and remembers where they wanted to go", async ({ page }) => {
    for (const path of ["/admin", "/admin/customers", "/admin/leads", `/admin/customers/${fixtureId("cus-01")}`]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/admin/login\\?next=${encodeURIComponent(path).replace(/\//g, "%2F")}`));
      await expect(page.getByRole("heading", { level: 1, name: t.login.title })).toBeVisible();
    }
  });

  test("after signing in the visitor lands on the page they asked for", async ({ page }) => {
    await page.goto("/admin/leads?stage=new");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(t.login.email).fill(demoAccount().email);
    await page.getByLabel(t.login.password).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: t.login.submit }).click();

    await expect(page).toHaveURL(/\/admin\/leads\?stage=new/);
    await expect(page.getByRole("heading", { level: 1, name: t.leads.title })).toBeVisible();
    await expect(page.getByLabel(t.leads.filters.stage)).toHaveValue("new");
  });

  test("a login link cannot send people to another website", async ({ page }) => {
    await visit(page, "/admin/login?next=https://evil.example/phish");
    await page.getByLabel(t.login.email).fill(demoAccount().email);
    await page.getByLabel(t.login.password).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: t.login.submit }).click();
    await expect(page).toHaveURL(/localhost:3100\/admin$/);
  });

  test("empty, wrong and deactivated logins are refused with a clear message", async ({ page }) => {
    await visit(page, "/admin/login");
    await page.getByRole("button", { name: t.login.submit }).click();
    await expect(pageAlerts(page)).toHaveCount(2);

    await page.getByLabel(t.login.email).fill(demoAccount().email);
    await page.getByLabel(t.login.password).fill("not-the-password");
    await page.getByRole("button", { name: t.login.submit }).click();
    await expect(pageAlerts(page).filter({ hasText: t.login.errors.invalid_credentials })).toBeVisible();

    await page.getByLabel(t.login.email).fill("marco.estrada@carrental.example");
    await page.getByLabel(t.login.password).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: t.login.submit }).click();
    await expect(pageAlerts(page).filter({ hasText: t.login.errors.account_inactive })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("staff", () => {
  test("everyone who signs in is an admin and sees every menu item", async ({ page }) => {
    await loginAs(page);
    await expect(page).toHaveURL(/localhost:3100\/admin$/);
    await expect(page.getByText(t.dashboard.welcome("Ramon Villareal"))).toBeVisible();
    await expect(sidebar(page).getByRole("link")).toHaveText([
      t.nav.dashboard,
      t.nav.customers,
      t.nav.leads,
      t.nav.pipeline,
      t.nav.tasks,
      t.nav.bookings,
      t.nav.reports,
      t.nav.pricing,
      t.nav.reviews,
      t.nav.users,
    ]);
    await expect(page.getByText(t.frame.brand, { exact: true }).first()).toBeVisible();
  });

  test("there are no roles: the roles page and the no-access page do not exist", async ({ page }) => {
    await loginAs(page);
    for (const path of ["/admin/roles", "/admin/forbidden"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
    }
  });

  test("can add, edit and delete customers", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/customers");
    await expect(page.getByRole("button", { name: t.customers.add })).toBeVisible();
    await visit(page, `/admin/customers/${fixtureId("cus-01")}`);
    await expect(page.getByRole("heading", { level: 1, name: "Juan Dela Cruz" })).toBeVisible();
    await expect(page.getByRole("button", { name: t.common.edit, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: t.common.delete, exact: true })).toBeVisible();
  });
});

test.describe("signed in", () => {
  test("the session is kept in a same-site cookie that the server checks", async ({ page, context }) => {
    await loginAs(page);
    // Supabase keeps the session in "sb-<project>-auth-token" cookies (readable by the page, which
    // refreshes the session; the database checks the token on every request).
    const cookies = (await context.cookies()).filter((c) => /^sb-.*-auth-token/.test(c.name));
    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) expect(cookie.sameSite).toBe("Lax");

    // Without the cookie, the admin area is closed again.
    await context.clearCookies();
    await page.goto("/admin/customers");
    await expect(page).toHaveURL(/\/admin\/login\?next=/);
  });

  test("the login page sends signed-in staff to their dashboard", async ({ page }) => {
    await loginAs(page);
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/localhost:3100\/admin$/);
  });

  test("logging out ends the session and protects the pages again", async ({ page }) => {
    await loginAs(page);
    await page.getByRole("button", { name: t.frame.logout }).click();
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto("/admin/customers");
    await expect(page).toHaveURL(/\/admin\/login\?next=/);
  });
});
