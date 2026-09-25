import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { loginAs, pageAlerts, visit } from "./helpers";

const t = content.contact.form;

const messageBox = (page: Page) => page.getByRole("textbox", { name: /^Message/ });

async function fillValidForm(page: Page, message: string) {
  await page.getByLabel(t.name).fill("Rosalinda Fuentes");
  await page.getByLabel(t.email).fill("rosalinda.fuentes@example.com");
  await page.getByLabel(t.phone).fill("0918 555 0177");
  await messageBox(page).fill(message);
  await page.getByLabel(t.consent).check();
}

test("an empty form shows every validation message and sends nothing", async ({ page }) => {
  await visit(page, "/contact");
  await page.getByRole("button", { name: t.submit }).click();

  const alerts = pageAlerts(page);
  await expect(alerts).toHaveCount(5);
  await expect(alerts.filter({ hasText: content.validation.required })).toHaveCount(1);
  await expect(alerts.filter({ hasText: content.validation.email })).toHaveCount(1);
  await expect(alerts.filter({ hasText: content.validation.phone })).toHaveCount(1);
  await expect(alerts.filter({ hasText: content.validation.messageTooShort })).toHaveCount(1);
  await expect(alerts.filter({ hasText: content.validation.consent })).toHaveCount(1);
  // The fields with problems are flagged for screen readers too.
  await expect(page.getByLabel(t.email)).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("heading", { name: t.successTitle })).toHaveCount(0);
});

test("wrong values are rejected with the right message", async ({ page }) => {
  await visit(page, "/contact");
  await page.getByLabel(t.name).fill("Rosalinda Fuentes");
  await page.getByLabel(t.email).fill("not-an-email");
  await page.getByLabel(t.phone).fill("12345");
  await messageBox(page).fill("short");
  await page.getByRole("button", { name: t.submit }).click();

  await expect(pageAlerts(page).filter({ hasText: content.validation.email })).toBeVisible();
  await expect(pageAlerts(page).filter({ hasText: content.validation.phone })).toBeVisible();
  await expect(pageAlerts(page).filter({ hasText: content.validation.messageTooShort })).toBeVisible();
});

test("a failed send keeps what was typed and can be retried", async ({ page }) => {
  await visit(page, "/contact");
  // "[fail]" is the demo trigger for the error state (see src/api/contact.ts).
  await fillValidForm(page, "I would like a van for a company trip. [fail]");
  await page.getByRole("button", { name: t.submit }).click();

  await expect(pageAlerts(page).filter({ hasText: t.errorTitle })).toBeVisible();
  await expect(page.getByLabel(t.name)).toHaveValue("Rosalinda Fuentes");

  await messageBox(page).fill("I would like a van for a company trip next month.");
  await page.getByRole("button", { name: t.submit }).click();
  await expect(page.getByRole("status").filter({ hasText: t.successTitle })).toBeVisible();
});

test("'Ask about this vehicle' preselects that vehicle", async ({ page }) => {
  await visit(page, "/vehicles/sedan");
  await page.getByRole("link", { name: content.vehicleDetail.askAbout }).click();
  await expect(page).toHaveURL(/\/contact\?vehicle=sedan/);
  await expect(page.getByLabel(t.vehicle)).toHaveValue("veh-03");
  await expect(page.getByLabel(t.vehicle).locator("option:checked")).toHaveText("Sedan");
});

test("a sent message becomes a New lead that staff can see", async ({ page }) => {
  await visit(page, "/contact?vehicle=sedan");
  await fillValidForm(page, "I would like a sedan for a family trip next month.");
  await page.getByRole("button", { name: t.submit }).click();

  await expect(page.getByRole("status").filter({ hasText: t.successTitle })).toContainText(t.successBody);
  // The form is cleared and can be used again.
  await page.getByRole("button", { name: t.sendAnother }).click();
  await expect(page.getByLabel(t.name)).toHaveValue("");

  // Same browser, so the fake database is shared: a Sales user finds the new lead.
  await loginAs(page);
  await visit(page, "/admin/leads");
  await page.getByRole("searchbox", { name: content.admin.leads.searchLabel }).fill("Rosalinda");
  const row = page.getByRole("row", { name: /Rosalinda Fuentes/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText(content.enums.leadStage.new);
  await expect(row).toContainText(content.enums.leadSource.website);
  await expect(row).toContainText("Sedan");

  await row.getByRole("link", { name: "Rosalinda Fuentes" }).click();
  await expect(page.getByText(/I would like a sedan for a family trip next month\./).first()).toBeVisible();
});
