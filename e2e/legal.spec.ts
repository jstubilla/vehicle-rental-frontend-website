import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { dateFromToday, expectNoA11yViolations, pageAlerts, visit } from "./helpers";

const legal = content.legal;
const b = content.booking;

const h1 = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });

/** A half-finished booking saved in the browser the way the real flow saves it. `withDetails` = the driver step is done. */
async function startWithBooking(page: Page, withDetails: boolean) {
  await page.addInitScript(
    ({ pickup, ret, withDetails }) => {
      sessionStorage.setItem(
        "car-rental-booking-flow",
        JSON.stringify({
          vehicleSlug: "sedan",
          rental: {
            pickupLocation: "NAIA Terminal 3, Pasay",
            returnLocation: "Makati CBD",
            pickupDate: pickup,
            pickupTime: "10:00",
            returnDate: ret,
            returnTime: "10:00",
          },
          customer: withDetails
            ? { name: "Lorenzo Buenaventura", email: "lorenzo.b@example.com", phone: "0917 555 0142", licenseNumber: "N21-25-778899", notes: "" }
            : null,
        }),
      );
    },
    { pickup: dateFromToday(60), ret: dateFromToday(63), withDetails },
  );
}

test.describe("the two legal pages", () => {
  for (const [linkName, path, doc] of [
    ["Privacy Policy", "/privacy", legal.privacy],
    ["Rental terms", "/terms", legal.terms],
  ] as const) {
    test(`${path} opens from the footer and shows the placeholder notice and every section`, async ({ page }) => {
      await visit(page, "/");
      await page.getByRole("contentinfo").getByRole("link", { name: linkName }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(h1(page, doc.title)).toBeVisible();
      await expect(page.getByText(legal.notice)).toBeVisible();
      for (const section of doc.sections) {
        await expect(page.getByRole("heading", { level: 2, name: section.title, exact: true })).toBeVisible();
      }
      await expect(page).toHaveTitle(new RegExp(doc.meta.title));
    });
  }

  test("the sitemap lists both pages", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/privacy");
    expect(xml).toContain("/terms");
  });

  test("there is no cookie banner", async ({ page }) => {
    await visit(page, "/");
    await expect(page.getByText(/cookie/i)).toHaveCount(0);
  });
});

test.describe("the terms link on the payment step", () => {
  test("opens the terms in a new tab, keeps the booking, and the checkbox works as before", async ({ page, context }) => {
    await startWithBooking(page, true);
    await visit(page, "/book/payment");
    await expect(h1(page, b.payment.title)).toBeVisible();

    const link = page.getByRole("link", { name: new RegExp(b.payment.termsLink) });
    await expect(link).toHaveAttribute("href", "/terms");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toContainText(content.ui.opensInNewTab);

    const [popup] = await Promise.all([context.waitForEvent("page"), link.click()]);
    await popup.waitForLoadState();
    expect(new URL(popup.url()).pathname).toBe("/terms");
    await popup.close();

    // The booking is still here, and clicking the link did not tick the box.
    await expect(page).toHaveURL(/\/book\/payment$/);
    await expect(page.getByRole("region", { name: b.summary.title })).toContainText("Sedan");
    const checkbox = page.getByLabel(b.payment.terms);
    await expect(checkbox).not.toBeChecked();

    // Same behavior as before: paying without agreeing shows the error; ticking removes it.
    await page.getByRole("button", { name: /and confirm booking$/ }).click();
    await expect(pageAlerts(page).filter({ hasText: b.payment.termsError })).toBeVisible();
    await checkbox.check();
    await expect(pageAlerts(page).filter({ hasText: b.payment.termsError })).toHaveCount(0);
  });
});

test.describe("privacy links on the forms that collect personal details", () => {
  const privacyLink = (page: Page) => page.getByRole("main").getByRole("link", { name: new RegExp(legal.privacyNote.link) });

  async function expectPrivacyLink(page: Page) {
    const link = privacyLink(page);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", "/privacy");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toContainText(content.ui.opensInNewTab);
  }

  test("contact form", async ({ page }) => {
    await visit(page, "/contact");
    await expectPrivacyLink(page);
  });

  test("sign-up form", async ({ page }) => {
    await visit(page, "/signup");
    await expectPrivacyLink(page);
  });

  test("review form", async ({ page }) => {
    await visit(page, "/review");
    await expectPrivacyLink(page);
  });

  test("booking details step", async ({ page }) => {
    await startWithBooking(page, false);
    await visit(page, "/book/details");
    await expect(h1(page, b.details.title)).toBeVisible();
    await expectPrivacyLink(page);
  });
});

for (const theme of ["light", "dark"] as const) {
  test.describe(`accessibility in ${theme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((chosen) => {
        if (!localStorage.getItem("car-rental-theme")) localStorage.setItem("car-rental-theme", chosen);
      }, theme);
    });

    for (const [path, title] of [
      ["/privacy", legal.privacy.title],
      ["/terms", legal.terms.title],
    ] as const) {
      test(`${path} has no accessibility problems`, async ({ page }) => {
        await visit(page, path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(h1(page, title)).toBeVisible();
        await expectNoA11yViolations(page);
      });
    }

    test("the payment step, with the terms link and its error, has no accessibility problems", async ({ page }) => {
      await startWithBooking(page, true);
      await visit(page, "/book/payment");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(h1(page, b.payment.title)).toBeVisible();
      await expectNoA11yViolations(page);
      await page.getByRole("button", { name: /and confirm booking$/ }).click();
      await expect(pageAlerts(page).filter({ hasText: b.payment.termsError })).toBeVisible();
      await expectNoA11yViolations(page);
    });
  });
}
