import { expect, test, type Page } from "@playwright/test";
import { DEMO_PASSWORD } from "../src/api/auth";
import { content } from "../src/content";
import { demoAccount, loginAs, pageAlerts, visit, type DemoRole } from "./helpers";

const t = content.admin;
const sidebar = (page: Page) => page.getByRole("navigation", { name: t.nav.label });

test.describe("signed out", () => {
  test("every admin page sends visitors to the login page and remembers where they wanted to go", async ({ page }) => {
    for (const path of ["/admin", "/admin/customers", "/admin/leads", "/admin/customers/cus-01"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/admin/login\\?next=${encodeURIComponent(path).replace(/\//g, "%2F")}`));
      await expect(page.getByRole("heading", { level: 1, name: t.login.title })).toBeVisible();
    }
  });

  test("after signing in the visitor lands on the page they asked for", async ({ page }) => {
    await page.goto("/admin/leads?stage=new");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(t.login.email).fill(demoAccount("Sales").email);
    await page.getByLabel(t.login.password).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: t.login.submit }).click();

    await expect(page).toHaveURL(/\/admin\/leads\?stage=new/);
    await expect(page.getByRole("heading", { level: 1, name: t.leads.title })).toBeVisible();
    await expect(page.getByLabel(t.leads.filters.stage)).toHaveValue("new");
  });

  test("a login link cannot send people to another website", async ({ page }) => {
    await visit(page, "/admin/login?next=https://evil.example/phish");
    await page.getByLabel(t.login.email).fill(demoAccount("Admin").email);
    await page.getByLabel(t.login.password).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: t.login.submit }).click();
    await expect(page).toHaveURL(/localhost:3100\/admin$/);
  });

  test("empty, wrong and deactivated logins are refused with a clear message", async ({ page }) => {
    await visit(page, "/admin/login");
    await page.getByRole("button", { name: t.login.submit }).click();
    await expect(pageAlerts(page)).toHaveCount(2);

    await page.getByLabel(t.login.email).fill(demoAccount("Admin").email);
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

/** What each starting role can open. Pages a role lacks send it to the "no access" page. */
const ROLES: { role: DemoRole; person: string; menu: string[]; blocked: string[]; canEditCustomers: boolean }[] = [
  {
    role: "Admin",
    person: "Ramon Villareal",
    menu: [
      t.nav.dashboard,
      t.nav.customers,
      t.nav.leads,
      t.nav.pipeline,
      t.nav.tasks,
      t.nav.bookings,
      t.nav.reports,
      t.nav.pricing,
      t.nav.users,
      t.nav.roles,
    ],
    blocked: [],
    canEditCustomers: true,
  },
  {
    role: "Sales",
    person: "Liza Manalo",
    menu: [t.nav.dashboard, t.nav.customers, t.nav.leads, t.nav.pipeline, t.nav.tasks, t.nav.bookings],
    blocked: ["/admin/reports", "/admin/pricing", "/admin/users", "/admin/roles"],
    canEditCustomers: true,
  },
  {
    role: "Accountant",
    person: "Beatriz Aquino",
    menu: [t.nav.dashboard, t.nav.customers, t.nav.bookings, t.nav.reports],
    blocked: ["/admin/leads", "/admin/leads/lead-01", "/admin/pipeline", "/admin/tasks", "/admin/pricing", "/admin/users", "/admin/roles"],
    canEditCustomers: false,
  },
  {
    role: "Operations",
    person: "Dennis Ocampo",
    menu: [t.nav.dashboard, t.nav.customers, t.nav.tasks, t.nav.bookings, t.nav.pricing],
    blocked: ["/admin/leads", "/admin/pipeline", "/admin/reports", "/admin/users", "/admin/roles"],
    canEditCustomers: false,
  },
];

for (const { role, person, menu, blocked, canEditCustomers } of ROLES) {
  test.describe(`${role} role`, () => {
    test("sees only the menu items it is allowed to use", async ({ page }) => {
      await loginAs(page, role);
      await expect(page).toHaveURL(/localhost:3100\/admin$/);
      await expect(page.getByText(t.dashboard.welcome(person))).toBeVisible();
      await expect(sidebar(page).getByRole("link")).toHaveText(menu);
      await expect(page.getByText(role, { exact: true }).first()).toBeVisible();
    });

    test("is turned away from pages its role does not include", async ({ page }) => {
      await loginAs(page, role);
      for (const path of blocked) {
        await visit(page, path);
        await expect(page).toHaveURL(/\/admin\/forbidden$/);
        await expect(page.getByRole("heading", { level: 1, name: t.forbidden.title })).toBeVisible();
      }
      // Pages it may open still work.
      await visit(page, "/admin/customers");
      await expect(page.getByRole("heading", { level: 1, name: t.customers.title })).toBeVisible();
    });

    test(`${canEditCustomers ? "can" : "cannot"} add or edit customers`, async ({ page }) => {
      await loginAs(page, role);

      await visit(page, "/admin/customers/cus-01");
      await expect(page.getByRole("heading", { level: 1, name: "Juan Dela Cruz" })).toBeVisible();
      const editButton = page.getByRole("button", { name: t.common.edit, exact: true });
      const deleteButton = page.getByRole("button", { name: t.common.delete, exact: true });

      await visit(page, "/admin/customers");
      await expect(page.getByRole("heading", { level: 1, name: t.customers.title })).toBeVisible();
      const addButton = page.getByRole("button", { name: t.customers.add });

      if (canEditCustomers) {
        await expect(addButton).toBeVisible();
        await visit(page, "/admin/customers/cus-01");
        await expect(editButton).toBeVisible();
        await expect(deleteButton).toBeVisible();
      } else {
        await expect(addButton).toHaveCount(0);
        await visit(page, "/admin/customers/cus-01");
        await expect(page.getByRole("heading", { level: 1, name: "Juan Dela Cruz" })).toBeVisible();
        await expect(editButton).toHaveCount(0);
        await expect(deleteButton).toHaveCount(0);
      }
    });
  });
}

test.describe("signed in", () => {
  test("the session cookie is hidden from page scripts", async ({ page, context }) => {
    await loginAs(page, "Admin");
    const cookie = (await context.cookies()).find((c) => c.name === "car-rental-session");
    expect(cookie?.httpOnly).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toContain("car-rental-session");
  });

  test("the login page sends signed-in staff to their dashboard", async ({ page }) => {
    await loginAs(page, "Sales");
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/localhost:3100\/admin$/);
  });

  test("logging out ends the session and protects the pages again", async ({ page }) => {
    await loginAs(page, "Sales");
    await page.getByRole("button", { name: t.frame.logout }).click();
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.goto("/admin/customers");
    await expect(page).toHaveURL(/\/admin\/login\?next=/);
  });
});
