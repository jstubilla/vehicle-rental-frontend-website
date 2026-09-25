import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { dateFromToday, expectNoA11yViolations, pageAlerts, visit } from "./helpers";

const t = content.account.login;
const s = content.account.signup;
const nav = content.nav.account;
const d = content.booking.details;

const emailBox = (page: Page) => page.getByRole("textbox", { name: /^Email/ });
const passwordBox = (page: Page) => page.locator("input[type=password]");
const greeting = (page: Page, firstName: string) => page.getByText(nav.hello(firstName));
const loginLink = (page: Page) => page.getByRole("banner").getByRole("link", { name: nav.login });

/** Logs in as the demo customer through the real form. */
async function loginAsDemoCustomer(page: Page, from = "/login") {
  await visit(page, from);
  await page.getByRole("button", { name: t.demo.use }).click();
  await page.getByRole("button", { name: t.submit }).click();
  await expect(greeting(page, "Maria")).toBeVisible();
}

/** Goes from the first booking step to step 3 (details) using a link that carries the trip. */
async function goToDetails(page: Page) {
  const query = new URLSearchParams({
    pickupLocation: "NAIA Terminal 3, Pasay",
    pickupDate: dateFromToday(20),
    pickupTime: "10:00",
    returnDate: dateFromToday(22),
    returnTime: "10:00",
    vehicle: "sedan",
  });
  await visit(page, `/book/dates?${query}`);
  await page.getByRole("button", { name: content.booking.common.continue }).click();
  await expect(page).toHaveURL(/\/book\/vehicle/);
  await page.getByRole("link", { name: content.booking.common.continue }).click();
  await expect(page).toHaveURL(/\/book\/details/);
}

test.describe("signing up", () => {
  test("an empty form shows every validation message", async ({ page }) => {
    await visit(page, "/signup");
    await page.getByRole("button", { name: s.submit }).click();
    await expect(pageAlerts(page)).toHaveCount(3);
    await expect(pageAlerts(page).filter({ hasText: content.validation.passwordShort })).toHaveCount(1);
  });

  test("an email that already has an account is refused", async ({ page }) => {
    await visit(page, "/signup");
    await page.getByLabel(s.name).fill("Someone Else");
    await page.getByLabel(s.email).fill(t.demo.email);
    await page.getByLabel(s.password).fill("longenough1");
    await page.getByRole("button", { name: s.submit }).click();
    await expect(page.getByText(s.errors.duplicate_email)).toBeVisible();
  });

  test("a new customer is signed in straight away, and can log out", async ({ page }) => {
    await visit(page, "/signup");
    await page.getByLabel(s.name).fill("Ana Reyes");
    await page.getByLabel(s.email).fill("ana.reyes@example.com");
    await page.getByLabel(s.password).fill("longenough1");
    await page.getByRole("button", { name: s.submit }).click();
    await expect(page).toHaveURL(/localhost:3100\/$/);
    await expect(greeting(page, "Ana")).toBeVisible();

    // Still signed in after a reload.
    await page.reload();
    await expect(greeting(page, "Ana")).toBeVisible();

    await page.getByRole("button", { name: nav.logout }).click();
    await expect(loginLink(page)).toBeVisible();
    await expect(greeting(page, "Ana")).toHaveCount(0);
  });
});

test.describe("logging in", () => {
  test("an empty form shows the validation messages", async ({ page }) => {
    await visit(page, "/login");
    await page.getByRole("button", { name: t.submit }).click();
    await expect(pageAlerts(page)).toHaveCount(2);
  });

  test("a wrong password is refused", async ({ page }) => {
    await visit(page, "/login");
    await emailBox(page).fill(t.demo.email);
    await passwordBox(page).fill("not-the-password");
    await page.getByRole("button", { name: t.submit }).click();
    await expect(page.getByText(t.errors.invalid_credentials)).toBeVisible();
    await expect(loginLink(page)).toBeVisible();
  });

  test("email and password works", async ({ page }) => {
    await loginAsDemoCustomer(page);
    await expect(page).toHaveURL(/localhost:3100\/$/);
  });

  test("an email code works: ask for it, then enter it", async ({ page }) => {
    await visit(page, "/login");
    await page.getByRole("tab", { name: t.tabCode }).click();

    // Unknown email: no code is sent.
    await emailBox(page).fill("nobody@example.com");
    await page.getByRole("button", { name: t.sendCode }).click();
    await expect(page.getByText(t.errors.no_account)).toBeVisible();

    await emailBox(page).fill(t.demo.email);
    await page.getByRole("button", { name: t.sendCode }).click();
    await expect(page.getByText(t.codeSent(t.demo.email))).toBeVisible();
    // Focus lands in the code box.
    await expect(page.getByLabel(t.code)).toBeFocused();

    await page.getByLabel(t.code).fill("12");
    await page.getByRole("button", { name: t.verify }).click();
    await expect(pageAlerts(page).filter({ hasText: content.validation.code })).toBeVisible();

    await page.getByLabel(t.code).fill("123456");
    await page.getByRole("button", { name: t.verify }).click();
    await expect(greeting(page, "Maria")).toBeVisible();
  });

  for (const [label, name] of [
    [t.google, "Google"],
    [t.apple, "Apple"],
  ] as const) {
    test(`"${label}" signs in`, async ({ page }) => {
      await visit(page, "/login");
      await page.getByRole("button", { name: label }).click();
      await expect(greeting(page, name)).toBeVisible();
    });
  }

  test("the tabs work with the keyboard", async ({ page }) => {
    await visit(page, "/login");
    await page.getByRole("tab", { name: t.tabPassword }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: t.tabCode })).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("saved details in the booking", () => {
  test("a signed-out visitor is told they can log in, and comes back to the booking", async ({ page }) => {
    await goToDetails(page);
    await expect(page.getByRole("heading", { name: d.savedDetails.title })).toHaveCount(0);
    await page.getByRole("main").getByRole("link", { name: d.loginPrompt.link }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fbook%2Fdetails|\/login\?next=\/book\/details/);
    await page.getByRole("button", { name: t.demo.use }).click();
    await page.getByRole("button", { name: t.submit }).click();
    await expect(page).toHaveURL(/\/book\/details/);
    await expect(page.getByRole("heading", { name: d.savedDetails.title })).toBeVisible();
  });

  test("saying yes fills in the details, which can still be changed", async ({ page }) => {
    await loginAsDemoCustomer(page);
    await goToDetails(page);
    await expect(page.getByRole("heading", { name: d.savedDetails.title })).toBeVisible();
    // Nothing is filled in until they say yes.
    await expect(page.getByLabel(d.name)).toHaveValue("");

    await page.getByRole("button", { name: d.savedDetails.yes }).click();
    await expect(page.getByRole("heading", { name: d.savedDetails.title })).toHaveCount(0);
    await expect(page.getByLabel(d.name)).toBeFocused();
    await expect(page.getByLabel(d.name)).toHaveValue("Maria Santos");
    await expect(page.getByLabel(d.email)).toHaveValue(t.demo.email);
    await expect(page.getByLabel(d.phone)).toHaveValue("0917 555 0100");
    await expect(page.getByLabel(d.license)).toHaveValue("N01-23-456789");

    await page.getByLabel(d.phone).fill("0918 555 0111");
    await page.getByRole("button", { name: content.booking.common.continue }).click();
    await expect(page).toHaveURL(/\/book\/check/);
  });

  test("saying no leaves the form empty", async ({ page }) => {
    await loginAsDemoCustomer(page);
    await goToDetails(page);
    await page.getByRole("button", { name: d.savedDetails.no }).click();
    await expect(page.getByRole("heading", { name: d.savedDetails.title })).toHaveCount(0);
    await expect(page.getByLabel(d.name)).toBeFocused();
    await expect(page.getByLabel(d.name)).toHaveValue("");
    await expect(page.getByLabel(d.phone)).toHaveValue("");
  });

  test("a new customer's details are saved after their first booking and offered on the next", async ({ page }) => {
    await visit(page, "/signup");
    await page.getByLabel(s.name).fill("Ana Reyes");
    await page.getByLabel(s.email).fill("ana.reyes@example.com");
    await page.getByLabel(s.password).fill("longenough1");
    await page.getByRole("button", { name: s.submit }).click();
    await expect(greeting(page, "Ana")).toBeVisible();

    await goToDetails(page);
    await page.getByRole("button", { name: d.savedDetails.yes }).click();
    // Only the name and email are known so far.
    await expect(page.getByLabel(d.name)).toHaveValue("Ana Reyes");
    await expect(page.getByLabel(d.phone)).toHaveValue("");
    await page.getByLabel(d.phone).fill("0917 555 0177");
    await page.getByLabel(d.license).fill("N05-11-223344");
    await page.getByRole("button", { name: content.booking.common.continue }).click();
    await page.getByRole("link", { name: content.booking.check.toPayment }).click();
    await page.getByRole("checkbox", { name: /rental terms/ }).check();
    await page.getByRole("button", { name: /and confirm booking$/ }).click();
    await expect(page).toHaveURL(/\/book\/confirmation\//);

    await page.getByRole("banner").getByRole("link", { name: content.nav.bookCta.label }).click();
    await goToDetails(page);
    await page.getByRole("button", { name: d.savedDetails.yes }).click();
    await expect(page.getByLabel(d.phone)).toHaveValue("0917 555 0177");
    await expect(page.getByLabel(d.license)).toHaveValue("N05-11-223344");
  });
});

test("the header does not overflow on a tablet or a phone when signed in", async ({ page }) => {
  await loginAsDemoCustomer(page);
  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await visit(page, "/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `page is wider than the screen at ${width}px`).toBeLessThanOrEqual(0);
  }
});

for (const theme of ["light", "dark"] as const) {
  test.describe(`accessibility in ${theme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((chosen) => {
        if (!localStorage.getItem("car-rental-theme")) localStorage.setItem("car-rental-theme", chosen);
      }, theme);
    });

    test("login, with errors, and the email code step", async ({ page }) => {
      await visit(page, "/login");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expectNoA11yViolations(page);
      await page.getByRole("button", { name: t.submit }).click();
      await expect(pageAlerts(page).first()).toBeVisible();
      await expectNoA11yViolations(page);

      await page.getByRole("tab", { name: t.tabCode }).click();
      await emailBox(page).fill(t.demo.email);
      await page.getByRole("button", { name: t.sendCode }).click();
      await expect(page.getByLabel(t.code)).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("sign up, empty and with errors", async ({ page }) => {
      await visit(page, "/signup");
      await expectNoA11yViolations(page);
      await page.getByRole("button", { name: s.submit }).click();
      await expect(pageAlerts(page).first()).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("booking details: signed out, and signed in with the saved-details question", async ({ page }) => {
      await goToDetails(page);
      await expectNoA11yViolations(page);
      await loginAsDemoCustomer(page);
      await goToDetails(page);
      await expect(page.getByRole("heading", { name: d.savedDetails.title })).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test("header when signed in", async ({ page }) => {
      await loginAsDemoCustomer(page);
      await expectNoA11yViolations(page);
    });
  });
}

test("the review form fills in a signed-in customer's name, which can still be changed", async ({ page }) => {
  await visit(page, "/review");
  await expect(page.getByLabel(content.reviews.form.name)).toHaveValue("");

  await loginAsDemoCustomer(page);
  await page.getByRole("contentinfo").getByRole("link", { name: "Leave a review" }).click();
  await expect(page.getByLabel(content.reviews.form.name)).toHaveValue("Maria Santos");
  await page.getByLabel(content.reviews.form.name).fill("Maria S.");
  await expect(page.getByLabel(content.reviews.form.name)).toHaveValue("Maria S.");
});
