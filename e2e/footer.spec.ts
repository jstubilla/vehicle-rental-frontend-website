import { expect, test } from "@playwright/test";
import { content } from "../src/content";
import { expectNoA11yViolations, visit } from "./helpers";

const footer = (page: import("@playwright/test").Page) => page.getByRole("contentinfo");

test("the footer shows the copyright and the credit, and only the public footer has the credit", async ({ page }) => {
  await visit(page, "/");
  await expect(footer(page).getByText(content.footer.legal)).toBeVisible();
  await expect(footer(page).getByText(content.footer.credit)).toBeVisible();
  // Plain text, not a link.
  await expect(footer(page).getByRole("link", { name: content.footer.credit })).toHaveCount(0);

  await visit(page, "/admin/login");
  await expect(page.getByText(content.footer.credit)).toHaveCount(0);
});

test("the credit sits on the right of the copyright on wide screens and under it on phones", async ({ page }) => {
  await visit(page, "/");
  const legal = footer(page).getByText(content.footer.legal);
  const credit = footer(page).getByText(content.footer.credit);

  await page.setViewportSize({ width: 1280, height: 800 });
  const [wideLegal, wideCredit] = [await legal.boundingBox(), await credit.boundingBox()];
  expect(wideCredit!.x).toBeGreaterThan(wideLegal!.x + wideLegal!.width);
  expect(Math.abs(wideCredit!.y - wideLegal!.y)).toBeLessThan(8);

  await page.setViewportSize({ width: 375, height: 800 });
  const [phoneLegal, phoneCredit] = [await legal.boundingBox(), await credit.boundingBox()];
  expect(phoneCredit!.y).toBeGreaterThan(phoneLegal!.y + phoneLegal!.height - 1);
});

test("the tap-to-call link keeps every digit of the phone number", async ({ page }) => {
  await visit(page, "/");
  const link = footer(page).getByRole("link", { name: content.site.contactPhone });
  const expected = content.site.contactPhone.replace(/[^+\d]/g, "");
  expect(expected).toBe("09543267335");
  await expect(link).toHaveAttribute("href", `tel:${expected}`);
  const digits = (await link.getAttribute("href"))!.replace(/\D/g, "");
  expect(digits).toBe(content.site.contactPhone.replace(/\D/g, ""));
});

for (const theme of ["light", "dark"] as const) {
  test(`the home page, with the credit, has no accessibility problems in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((chosen) => {
      if (!localStorage.getItem("car-rental-theme")) localStorage.setItem("car-rental-theme", chosen);
    }, theme);
    await visit(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(footer(page).getByText(content.footer.credit)).toBeVisible();
    await expectNoA11yViolations(page);
  });
}

test("the About page introduces the owner, co-owner and admin", async ({ page }) => {
  await visit(page, "/about");
  const team = page.getByRole("region", { name: content.about.team.title });
  for (const [name, role] of [
    ["Peter Agravidor", "Owner"],
    ["Erika Lasac", "Co-owner"],
    ["Cynde Agraviador", "Admin"],
  ]) {
    await expect(team).toContainText(name);
    await expect(team).toContainText(role);
  }
  await visit(page, "/contact");
  await expect(page.getByRole("main").getByText("0954 326 7335")).toBeVisible();
});
