import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { seedBookings } from "../src/mocks/bookings";
import { seedReviews } from "../src/mocks/reviews";
import { expectNoA11yViolations, loginAs, pageAlerts, visit } from "./helpers";

const t = content.reviews.form;
const admin = content.admin.reviews;
const home = content.home.reviews;

const VALID_REFERENCE = seedBookings[0].reference;
const shownSeed = seedReviews.filter((review) => review.published);
const hiddenSeed = seedReviews.filter((review) => !review.published);

const h1 = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });
const homeReviews = (page: Page) => page.getByRole("region", { name: home.title });

async function fillValidForm(page: Page, comment: string, reference = VALID_REFERENCE) {
  await page.getByLabel(t.name).fill("Rosalinda Fuentes");
  await page.getByRole("radio", { name: content.ui.rating.option(4) }).check({ force: true });
  await page.getByRole("textbox", { name: new RegExp(`^${t.comment}`) }).fill(comment);
  await page.getByLabel(t.reference).fill(reference);
}

test.describe("the review form", () => {
  test("is linked from the footer", async ({ page }) => {
    await visit(page, "/");
    await page.getByRole("contentinfo").getByRole("link", { name: "Leave a review" }).click();
    await expect(page).toHaveURL(/\/review$/);
    await expect(h1(page, content.reviews.title)).toBeVisible();
  });

  test("an empty form shows every validation message and sends nothing", async ({ page }) => {
    await visit(page, "/review");
    await page.getByRole("button", { name: t.submit }).click();
    const alerts = pageAlerts(page);
    await expect(alerts).toHaveCount(4);
    await expect(alerts.filter({ hasText: content.validation.rating })).toHaveCount(1);
    await expect(alerts.filter({ hasText: content.validation.messageTooShort })).toHaveCount(1);
    await expect(page.getByText(t.successTitle)).toHaveCount(0);
  });

  test("the stars work with the arrow keys and are announced as radio buttons", async ({ page }) => {
    await visit(page, "/review");
    const group = page.getByRole("group", { name: new RegExp(`^${t.rating}`) });
    await expect(group.getByRole("radio")).toHaveCount(5);
    await page.getByRole("radio", { name: content.ui.rating.option(1) }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: content.ui.rating.option(3) })).toBeChecked();
  });

  test("a booking reference that does not exist is rejected beside its field", async ({ page }) => {
    await visit(page, "/review");
    await fillValidForm(page, "This review should not be saved.", "RC-NOPE99");
    await page.getByRole("button", { name: t.submit }).click();
    await expect(pageAlerts(page).filter({ hasText: t.unknownReference })).toBeVisible();
    await expect(page.getByLabel(t.reference)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(t.successTitle)).toHaveCount(0);
  });

  test("a server failure shows the error message and keeps what was typed", async ({ page }) => {
    await visit(page, "/review");
    await fillValidForm(page, "Please fail this one [fail]");
    await page.getByRole("button", { name: t.submit }).click();
    await expect(page.getByText(t.errorTitle)).toBeVisible();
    await expect(page.getByLabel(t.name)).toHaveValue("Rosalinda Fuentes");
  });
});

test.describe("what the public sees", () => {
  test("the home page reviews section has a button that opens the review form", async ({ page }) => {
    // Shown right away, before the reviews have loaded, and it works from the keyboard.
    await page.goto("/");
    const button = homeReviews(page).getByRole("link", { name: home.write });
    await expect(button).toBeVisible();
    await page.waitForLoadState("networkidle");
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/review$/);
    await expect(h1(page, content.reviews.title)).toBeVisible();
  });

  test("only the reviews staff chose to show", async ({ page }) => {
    await visit(page, "/");
    const section = homeReviews(page);
    await expect(section.getByRole("listitem")).toHaveCount(shownSeed.length);
    for (const review of shownSeed) await expect(section.getByText(review.comment)).toBeVisible();
    for (const review of hiddenSeed) await expect(page.getByText(review.comment)).toHaveCount(0);
    await expect(section.getByRole("img", { name: content.ui.rating.stars(5) }).first()).toBeVisible();
    // The booking reference is private.
    await expect(page.getByText(shownSeed[0].bookingReference)).toHaveCount(0);
  });
});

test.describe("staff", () => {
  test("a new review is private until staff switch it on, and switching it off hides it again", async ({ page }) => {
    const comment = "The driver was on time and the car was clean.";
    await visit(page, "/review");
    await fillValidForm(page, comment);
    await page.getByRole("button", { name: t.submit }).click();
    await expect(page.getByText(t.successTitle)).toBeVisible();

    // Private: not on the website yet.
    await visit(page, "/");
    await expect(homeReviews(page).getByRole("listitem")).toHaveCount(shownSeed.length);
    await expect(page.getByText(comment)).toHaveCount(0);

    await loginAs(page);
    await visit(page, "/admin/reviews");
    await expect(h1(page, admin.title)).toBeVisible();
    const row = page.getByRole("row", { name: new RegExp(comment) });
    const toggle = row.getByRole("switch", { name: admin.showSwitch("Rosalinda Fuentes") });
    await expect(toggle).not.toBeChecked();
    await expect(row).toContainText(VALID_REFERENCE);

    await toggle.click();
    await expect(toggle).toBeChecked();
    await visit(page, "/");
    await expect(homeReviews(page).getByText(comment)).toBeVisible();

    await visit(page, "/admin/reviews");
    const again = page.getByRole("row", { name: new RegExp(comment) }).getByRole("switch");
    await again.click();
    await expect(again).not.toBeChecked();
    await visit(page, "/");
    await expect(homeReviews(page).getByRole("listitem")).toHaveCount(shownSeed.length);
    await expect(page.getByText(comment)).toHaveCount(0);
  });

  test("the switch works with the keyboard", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/reviews");
    const first = shownSeed[0];
    const toggle = page.getByRole("switch", { name: admin.showSwitch(first.name) });
    await expect(toggle).toBeChecked();
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).not.toBeChecked();
  });

  test("the admin list shows every review, shown or not", async ({ page }) => {
    await loginAs(page);
    await visit(page, "/admin/reviews");
    await expect(page.getByRole("row")).toHaveCount(seedReviews.length + 1);
    await expect(page.getByRole("switch", { checked: true })).toHaveCount(shownSeed.length);
  });

});

/** The same pages, once in each theme. */
for (const theme of ["light", "dark"] as const) {
  test.describe(`accessibility in ${theme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((chosen) => {
        if (!localStorage.getItem("car-rental-theme")) localStorage.setItem("car-rental-theme", chosen);
      }, theme);
    });

    test("review form, empty and with errors", async ({ page }) => {
      await visit(page, "/review");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expectNoA11yViolations(page);
      await page.getByRole("button", { name: t.submit }).click();
      await expect(pageAlerts(page).first()).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("review form with a chosen rating, and after sending", async ({ page }) => {
      await visit(page, "/review");
      await fillValidForm(page, "Everything went well from start to finish.");
      await expectNoA11yViolations(page);
      await page.getByRole("button", { name: t.submit }).click();
      await expect(page.getByText(t.successTitle)).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("home page with the shown reviews", async ({ page }) => {
      await visit(page, "/");
      await expect(homeReviews(page).getByRole("listitem")).toHaveCount(shownSeed.length);
      await expectNoA11yViolations(page);
    });

    test("admin review list", async ({ page }) => {
      await loginAs(page);
      await visit(page, "/admin/reviews");
      await expect(page.getByRole("row")).toHaveCount(seedReviews.length + 1);
      await expectNoA11yViolations(page);
    });
  });
}
