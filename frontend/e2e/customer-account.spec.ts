import { expect, test, type Page } from "./test";
import { content } from "../src/content";
import { seedAccounts } from "./fixtures/accounts";
import { seedBookings } from "./fixtures/bookings";
import { seedCustomers } from "./fixtures/customers";
import { latestLoginCode } from "./mail";
import { addApprovedBooking, dateFromToday, expectNoA11yViolations, pageAlerts, uploadDocuments, visit } from "./helpers";

const t = content.account.login;
const s = content.account.signup;
const nav = content.nav.account;
const d = content.booking.details;

const emailBox = (page: Page) => page.getByRole("textbox", { name: /^Email/ });
const passwordBox = (page: Page) => page.locator("input[type=password]");
const greeting = (page: Page, firstName: string) => page.getByText(nav.hello(firstName));
const loginLink = (page: Page) => page.getByRole("banner").getByRole("link", { name: nav.login });

/** The seeded website customer (backend/supabase/seed.sql). */
const demo = seedAccounts[0];

async function fillDemoLogin(page: Page) {
  await emailBox(page).fill(demo.email);
  await passwordBox(page).fill(demo.password);
  await page.getByRole("button", { name: t.submit }).click();
}

/** Logs in as the demo customer through the real form. */
async function loginAsDemoCustomer(page: Page, from = "/login") {
  await visit(page, from);
  await fillDemoLogin(page);
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
    await page.getByLabel(s.email).fill(demo.email);
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
    await emailBox(page).fill(demo.email);
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

    const sentAfter = new Date();
    await emailBox(page).fill(demo.email);
    await page.getByRole("button", { name: t.sendCode }).click();
    await expect(page.getByText(t.codeSent(demo.email))).toBeVisible();
    // Focus lands in the code box.
    await expect(page.getByLabel(t.code)).toBeFocused();

    await page.getByLabel(t.code).fill("12");
    await page.getByRole("button", { name: t.verify }).click();
    await expect(pageAlerts(page).filter({ hasText: content.validation.code })).toBeVisible();

    // A wrong code is refused; the one from the email works.
    const code = await latestLoginCode(demo.email, sentAfter);
    await page.getByLabel(t.code).fill(code === "000000" ? "111111" : "000000");
    await page.getByRole("button", { name: t.verify }).click();
    await expect(page.getByText(t.errors.invalid_code)).toBeVisible();
    await page.getByLabel(t.code).fill(code);
    await page.getByRole("button", { name: t.verify }).click();
    await expect(greeting(page, "Maria")).toBeVisible();
  });

  for (const [label, provider] of [
    [t.google, "google"],
    [t.apple, "apple"],
  ] as const) {
    // The provider's own page can't be tested here: check the visitor is sent to it through Supabase,
    // with the way back to this site's /auth/callback.
    test(`"${label}" sends the visitor to ${provider}`, async ({ page }) => {
      await visit(page, "/login?next=/my-bookings");
      const leaving = page.waitForRequest((request) => request.url().includes(`/auth/v1/authorize?provider=${provider}`));
      await page.getByRole("button", { name: label }).click();
      const url = new URL((await leaving).url());
      expect(url.searchParams.get("redirect_to")).toBe("http://localhost:3100/auth/callback?next=%2Fmy-bookings");
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
    await fillDemoLogin(page);
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
    await expect(page.getByLabel(d.email)).toHaveValue(demo.email);
    await expect(page.getByLabel(d.phone)).toHaveValue("0917 555 0100");
    await expect(page.getByLabel(d.license)).toHaveValue("N01-23-456789");

    await page.getByLabel(d.phone).fill("0918 555 0111");
    await uploadDocuments(page);
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
    await uploadDocuments(page);
    await page.getByRole("button", { name: content.booking.common.continue }).click();
    await page.getByRole("link", { name: content.booking.check.toSubmit }).click();
    await page.getByRole("checkbox", { name: /rental terms/ }).check();
    await page.getByRole("button", { name: content.booking.submit.send }).click();
    await expect(page).toHaveURL(/\/book\/confirmation\//);

    await page.getByRole("banner").getByRole("link", { name: content.nav.bookCta.label }).click();
    await goToDetails(page);
    await page.getByRole("button", { name: d.savedDetails.yes }).click();
    await expect(page.getByLabel(d.phone)).toHaveValue("0917 555 0177");
    await expect(page.getByLabel(d.license)).toHaveValue("N05-11-223344");
  });
});

test.describe("my bookings", () => {
  const mb = content.account.bookings;

  test("signed out, it asks the visitor to log in", async ({ page }) => {
    await visit(page, "/my-bookings");
    await expect(page.getByRole("heading", { level: 1, name: mb.signedOutTitle })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: mb.login })).toHaveAttribute("href", "/login?next=/my-bookings");
  });

  test("a signed-in customer sees their bookings and can pay one that is approved", async ({ page }) => {
    const maria = seedCustomers.find((customer) => customer.email === demo.email)!;
    const { reference } = await addApprovedBooking(page, { customerId: maria.id });
    await loginAsDemoCustomer(page);

    await page.getByRole("banner").getByRole("link", { name: content.nav.account.myBookings }).click();
    await expect(page).toHaveURL(/\/my-bookings$/);
    await expect(page.getByRole("heading", { level: 1, name: mb.title })).toBeVisible();

    // Every booking made with her email is listed, and only those.
    for (const booking of seedBookings.filter((b) => b.customerId === maria.id)) {
      await expect(page.getByRole("heading", { name: booking.reference })).toBeVisible();
    }
    const other = seedBookings.find((b) => b.customerId !== maria.id)!;
    await expect(page.getByRole("heading", { name: other.reference })).toHaveCount(0);

    // The approved one waits on her, so it comes first with Pay now.
    const needsAction = page.getByRole("region", { name: mb.needsAction });
    await expect(needsAction.getByRole("heading", { name: reference })).toBeVisible();
    await needsAction.getByRole("link", { name: mb.payNow }).click();

    // Her email is already filled in on the pay page.
    await expect(page.getByLabel(content.booking.access.email)).toHaveValue(demo.email);
    await page.getByRole("button", { name: content.booking.access.continue }).click();
    await expect(page.getByRole("heading", { level: 1, name: content.booking.payment.title })).toBeVisible();
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
      await emailBox(page).fill(demo.email);
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
