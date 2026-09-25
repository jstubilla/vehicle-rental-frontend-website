import { expect, test, type Page } from "@playwright/test";
import { DEMO_PASSWORD } from "../src/api/auth";
import { content } from "../src/content";
import { formatCurrency } from "../src/lib/currency";
import { seedBookings } from "../src/mocks/bookings";
import { loginAs, pageAlerts, visit } from "./helpers";

const t = content.admin;

/** The section of a page that has this heading (cards, columns and panels are labelled by their heading). */
const region = (page: Page, name: string) => page.getByRole("region", { name, exact: true });

test.describe("bookings", () => {
  const pending = seedBookings.find((booking) => booking.status === "pending")!;

  test("staff move a booking through its whole life and record the payment", async ({ page }) => {
    await loginAs(page);
    await visit(page, `/admin/bookings/${pending.id}`);
    await expect(page.getByRole("heading", { level: 1, name: pending.reference })).toBeVisible();

    const status = region(page, t.bookings.detail.status);
    await expect(status.getByText(content.enums.bookingStatus.pending, { exact: true })).toBeVisible();

    // A pay-at-pick-up payment is still owed until staff record it.
    await page.getByRole("button", { name: t.bookings.detail.markPaid }).click();
    await expect(region(page, t.bookings.detail.payment).getByText(content.enums.paymentStatus.paid, { exact: true })).toBeVisible();

    for (const [action, expected] of [
      [t.bookings.detail.actions.confirmed, content.enums.bookingStatus.confirmed],
      [t.bookings.detail.actions.active, content.enums.bookingStatus.active],
      [t.bookings.detail.actions.completed, content.enums.bookingStatus.completed],
    ] as const) {
      await status.getByRole("button", { name: action }).click();
      await expect(status.getByText(expected, { exact: true })).toBeVisible();
    }
    // Completed bookings are final: no more actions.
    await expect(status.getByRole("button")).toHaveCount(0);
    await expect(status.getByText(t.bookings.detail.finalStatus)).toBeVisible();
  });

  test("cancelling asks first", async ({ page }) => {
    await loginAs(page);
    await visit(page, `/admin/bookings/${pending.id}`);
    await page.getByRole("button", { name: t.bookings.detail.actions.cancelled }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(t.bookings.detail.cancelTitle);
    await dialog.getByRole("button", { name: t.bookings.detail.keep }).click();
    await expect(region(page, t.bookings.detail.status).getByText(content.enums.bookingStatus.pending, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: t.bookings.detail.actions.cancelled }).click();
    await page.getByRole("dialog").getByRole("button", { name: t.bookings.detail.cancelConfirm }).click();
    await expect(region(page, t.bookings.detail.status).getByText(content.enums.bookingStatus.cancelled, { exact: true })).toBeVisible();
  });

  test("the booking list can be filtered and searched", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/bookings");
    await expect(page.getByRole("status").filter({ hasText: /of 15/ })).toBeVisible();

    await page.getByLabel(t.bookings.filters.status).selectOption("pending");
    await expect(page.getByRole("row")).toHaveCount(2); // header + the one pending booking
    await expect(page.getByRole("row", { name: new RegExp(pending.reference) })).toBeVisible();

    await page.getByLabel(t.bookings.filters.status).selectOption("");
    await page.getByRole("searchbox", { name: t.bookings.searchLabel }).fill("garcia");
    await expect(page.getByRole("row")).toHaveCount(2);
    await expect(page.getByRole("row", { name: /Ana Garcia/ })).toBeVisible();
  });
});

test.describe("pricing", () => {
  test("a new daily rate shows on the public site right away", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/pricing");
    const row = page.getByRole("row", { name: /Sedan/ });
    await expect(row).toContainText(formatCurrency(1800));

    await row.getByRole("button", { name: t.pricing.change }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(t.pricing.currentRate(formatCurrency(1800)));

    // Bad values are refused.
    const rate = dialog.getByLabel(t.pricing.rateLabel);
    for (const bad of ["abc", "50", "1800"]) {
      await rate.fill(bad);
      await dialog.getByRole("button", { name: t.common.save }).click();
      await expect(dialog.getByRole("alert")).toContainText(bad === "1800" ? t.pricing.noChange : t.pricing.invalid);
    }

    await rate.fill("1900");
    await dialog.getByRole("button", { name: t.common.save }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(row).toContainText(formatCurrency(1900));

    // Same browser, so the public website sees the change.
    await visit(page, "/vehicles/sedan");
    await expect(page.getByRole("complementary", { name: "Sedan" })).toContainText(formatCurrency(1900));
  });
});

test.describe("tasks", () => {
  test("a task added on a lead's page appears everywhere and can be finished", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/leads/lead-03");

    const card = region(page, t.tasks.linkedCard.title);
    await expect(card).toContainText("Call back Hazel about airport pick-up rates");

    await card.getByRole("button", { name: t.tasks.linkedCard.add }).click();
    const dialog = page.getByRole("dialog");
    // The task is already about this lead, so the "about" fields are not offered.
    await expect(dialog.getByLabel(t.tasks.form.linkType)).toHaveCount(0);
    await dialog.getByLabel(t.tasks.form.title).fill("Email the airport rate card");
    await dialog.getByRole("button", { name: t.common.save }).click();
    await expect(card).toContainText("Email the airport rate card");

    await visit(page, "/admin/tasks");
    await expect(page.getByRole("row", { name: /Email the airport rate card/ })).toContainText("Hazel Dimaculangan");

    // Finishing it takes it off the open list and notes it on the lead.
    // The box only flips once the change is saved, so click it rather than check().
    await page.getByRole("checkbox", { name: t.tasks.markDone("Email the airport rate card") }).click();
    await expect(page.getByRole("row", { name: /Email the airport rate card/ })).toHaveCount(0);
    await page.getByLabel(t.tasks.filters.status).selectOption("done");
    await expect(page.getByRole("row", { name: /Email the airport rate card/ })).toBeVisible();

    await visit(page, "/admin/leads/lead-03");
    await expect(page.getByText(t.tasks.completedNote("Email the airport rate card"))).toBeVisible();
  });

  test("overdue tasks are flagged and the form checks its fields", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/tasks");
    await expect(page.getByRole("row", { name: /Follow up Gerald Uy/ })).toContainText(t.tasks.overdue);

    await page.getByRole("button", { name: t.tasks.add }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(t.tasks.form.linkType).selectOption("customer");
    await dialog.getByRole("button", { name: t.common.save }).click();
    await expect(dialog.getByRole("alert").filter({ hasText: content.validation.required })).toBeVisible();
    await expect(dialog.getByRole("alert").filter({ hasText: t.tasks.form.linkRequired })).toBeVisible();
  });
});

test.describe("pipeline", () => {
  const column = (page: Page, stage: keyof typeof content.enums.leadStage) =>
    region(page, content.enums.leadStage[stage]);

  test("a card can be dragged to another stage with the mouse", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/pipeline");
    await expect(column(page, "new").getByRole("listitem")).toHaveCount(4);
    await expect(column(page, "qualified").getByRole("listitem")).toHaveCount(3);

    const handle = column(page, "new").getByRole("button", { name: /^Drag / }).first();
    const from = (await handle.boundingBox())!;
    const to = (await column(page, "qualified").boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + 24, from.y + 24, { steps: 6 });
    await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 20 });
    await page.mouse.up();

    await expect(column(page, "new").getByRole("listitem")).toHaveCount(3);
    await expect(column(page, "qualified").getByRole("listitem")).toHaveCount(4);
  });

  test("the Move to menu works without dragging, and the move is logged on the lead", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/pipeline");

    const card = column(page, "new").getByRole("listitem").first();
    const name = (await card.getByRole("link").first().textContent())!;
    await card.getByRole("combobox").selectOption("contacted");
    await expect(column(page, "contacted").getByRole("link", { name })).toBeVisible();
    await expect(column(page, "new").getByRole("link", { name })).toHaveCount(0);

    await column(page, "contacted").getByRole("link", { name }).click();
    await expect(page.getByText(t.leads.stageChangeNote(content.enums.leadStage.new, content.enums.leadStage.contacted))).toBeVisible();
  });
});

test.describe("reports", () => {
  test("the numbers on the cards match the table underneath, and the date range can change", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/reports");
    await expect(page.getByRole("heading", { level: 1, name: t.reports.title })).toBeVisible();

    const revenueCard = page.getByRole("article").filter({ hasText: t.reports.summary.revenue });
    const revenue = (await revenueCard.locator("p").first().textContent())!;
    expect(revenue).toMatch(/^₱[\d,]+\.\d{2} \(~\$[\d,]+\)$/);

    await page.getByRole("tab", { name: t.reports.tabs.table }).nth(2).click();
    await expect(page.getByRole("row", { name: new RegExp(`^${t.reports.revenue.total}`) })).toContainText(revenue);

    // A different range gives a different report.
    await page.getByRole("button", { name: t.reports.range.presets.last30 }).click();
    await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}/);
    await expect(revenueCard.locator("p").first()).not.toHaveText(revenue);
  });

  test("an end date before the start date is refused", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/reports?from=2026-09-30&to=2026-09-01");
    await expect(pageAlerts(page).filter({ hasText: t.reports.range.invalid })).toBeVisible();
    await expect(page.getByRole("figure")).toHaveCount(0);
  });
});

test.describe("users", () => {
  test("a new staff member is an admin from their first sign-in", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/users");
    await expect(page.getByRole("columnheader", { name: /^Role/ })).toHaveCount(0);

    await page.getByRole("button", { name: t.users.add }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel(/^Role/)).toHaveCount(0);
    await dialog.getByLabel(t.users.form.name).fill("Carmela Ortega");
    await dialog.getByLabel(t.users.form.email).fill("carmela.ortega@carrental.example");
    await dialog.getByRole("button", { name: t.common.save }).click();
    await expect(page.getByRole("row", { name: /Carmela Ortega/ })).toBeVisible();

    await page.getByRole("button", { name: t.frame.logout }).click();
    await page.waitForURL(/\/admin\/login/);
    await page.waitForLoadState("networkidle");
    await page.getByLabel(t.login.email).fill("carmela.ortega@carrental.example");
    await page.getByLabel(t.login.password).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: t.login.submit }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("navigation", { name: t.nav.label }).getByRole("link")).toHaveCount(10);
    await visit(page, "/admin/users");
    await expect(page.getByRole("heading", { level: 1, name: t.users.title })).toBeVisible();
  });

  test("nobody can lock everyone out", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/users");
    const me = page.getByRole("row", { name: /Ramon Villareal/ });
    await expect(me.getByRole("button", { name: new RegExp(`^${t.users.deactivate}`) })).toBeDisabled();
  });
});
