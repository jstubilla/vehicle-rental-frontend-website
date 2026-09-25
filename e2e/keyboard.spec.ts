import { expect, test } from "@playwright/test";
import { content } from "../src/content";
import { loginAs, pageAlerts, visit } from "./helpers";

/**
 * Keyboard-only use. Every test here uses the Tab, Enter, Space, Escape and arrow keys only:
 * no mouse clicks. People who cannot use a mouse depend on all of this working.
 */

test("the skip link jumps past the header into the page", async ({ page }) => {
  await visit(page, "/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: content.nav.skipToContent });
  await expect(skip).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  // The next Tab starts from the main content, not from the header navigation.
  await page.keyboard.press("Tab");
  const insideMain = await page.evaluate(() => !!document.activeElement?.closest("main"));
  expect(insideMain).toBe(true);
});

test("the contact form can be filled and submitted with the keyboard, and errors take focus", async ({ page }) => {
  await visit(page, "/contact");
  const send = page.getByRole("button", { name: content.contact.form.submit });

  // Submitting empty puts the cursor on the first field with a problem.
  await send.focus();
  await page.keyboard.press("Enter");
  await expect(pageAlerts(page)).toHaveCount(5);
  await expect(page.getByLabel(content.contact.form.name)).toBeFocused();

  // Tab moves through the fields in reading order.
  await page.keyboard.type("Lorenzo Buenaventura");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(content.contact.form.email)).toBeFocused();
});

test("the calendar opens, moves and picks a date with arrow keys, then hands focus back", async ({ page }) => {
  await visit(page, "/");
  const trigger = page.getByRole("button", { name: new RegExp(content.quickSearch.pickupDate) });
  const before = await trigger.textContent();

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("grid")).toBeVisible();

  // Focus is inside the calendar; arrows move the day, Enter picks it.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("grid")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await trigger.textContent()).not.toBe(before);
});

test("Escape closes the calendar without changing the date", async ({ page }) => {
  await visit(page, "/");
  const trigger = page.getByRole("button", { name: new RegExp(content.quickSearch.pickupDate) });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("grid")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("grid")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("a dialog keeps focus inside it, closes with Escape and returns focus to its button", async ({ page }) => {
  await loginAs(page);
  await visit(page, "/admin/customers");
  const add = page.getByRole("button", { name: content.admin.customers.add });
  await add.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Focus starts inside the dialog...
  expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
  // ...and stays there however many times Tab is pressed.
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(add).toBeFocused();
});

test("the phone menu opens and closes from the keyboard and gives focus back", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await visit(page, "/vehicles");
  const open = page.getByRole("button", { name: content.ui.openMenu });
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: content.ui.closeMenu })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: content.ui.openMenu })).toBeVisible();
  await expect(page.getByRole("button", { name: content.ui.openMenu })).toBeFocused();
});

test("a pipeline card can be moved to the next stage using only the keyboard", async ({ page }) => {
  await loginAs(page);
  await visit(page, "/admin/pipeline");

  const stage = (name: keyof typeof content.enums.leadStage) =>
    page.getByRole("region", { name: content.enums.leadStage[name], exact: true });
  const card = stage("new").getByRole("listitem").first();
  const name = (await card.getByRole("link").first().textContent())!;

  // Focus the card's "Move to" menu and press the down arrow: New becomes Contacted.
  await card.getByRole("combobox").focus();
  await page.keyboard.press("ArrowDown");
  await expect(stage("contacted").getByRole("link", { name })).toBeVisible();
  await expect(stage("new").getByRole("link", { name })).toHaveCount(0);
});

test("the theme toggle works from the keyboard and its choice survives a reload", async ({ page }) => {
  await visit(page, "/");
  const toDark = page.getByRole("button", { name: content.ui.theme.toggleToDark });
  await toDark.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const toLight = page.getByRole("button", { name: content.ui.theme.toggleToLight });
  await expect(toLight).toBeFocused();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: content.ui.theme.toggleToLight })).toBeVisible();
});
