import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { formatCurrency } from "../src/lib/currency";
import { dateFromToday, pageAlerts, visit } from "./helpers";

const b = content.booking;

/** How many bookings and payments the fake database holds right now. */
const savedCounts = (page: Page) =>
  page.evaluate(() => {
    const key = Object.keys(localStorage).find((name) => name.startsWith("car-rental-mock-db"))!;
    const db = JSON.parse(localStorage.getItem(key)!);
    return { bookings: db.bookings.length, payments: db.payments.length };
  });

/** Step 3: driver details. */
async function fillDetails(page: Page) {
  await page.getByLabel(b.details.name).fill("Lorenzo Buenaventura");
  await page.getByLabel(b.details.email).fill("lorenzo.b@example.com");
  await page.getByLabel(b.details.phone).fill("0917 555 0142");
  await page.getByLabel(b.details.license).fill("N21-25-778899");
  await page.getByRole("button", { name: b.common.continue }).click();
}

/** Jumps into the flow with the dates and vehicle in the link, then goes through steps 1 to 3. */
async function reachPayment(page: Page, slug: string, startInDays: number, nights: number) {
  const query = new URLSearchParams({
    pickupLocation: "NAIA Terminal 3, Pasay",
    pickupDate: dateFromToday(startInDays),
    pickupTime: "10:00",
    returnDate: dateFromToday(startInDays + nights),
    returnTime: "10:00",
    vehicle: slug,
  });
  await visit(page, `/book/dates?${query}`);
  await page.getByRole("button", { name: b.common.continue }).click();
  await expect(page).toHaveURL(/\/book\/vehicle/);
  await page.getByRole("link", { name: b.common.continue }).click();
  await expect(page).toHaveURL(/\/book\/details/);
  await fillDetails(page);
  await expect(page).toHaveURL(/\/book\/check/);
  await page.getByRole("link", { name: b.check.toPayment }).click();
  await expect(page).toHaveURL(/\/book\/payment/);
}

test("a visitor completes all six steps, including a declined payment", async ({ page }) => {
  let tripQuery = "";

  await test.step("Home: search for a car", async () => {
    await visit(page, "/");
    await page.getByLabel(content.quickSearch.pickupLocation).fill("Makati CBD");
    await page.getByRole("button", { name: content.quickSearch.submit }).click();
    await expect(page).toHaveURL(/\/vehicles\?.*pickupLocation=Makati/);
    tripQuery = new URL(page.url()).search;
    await expect(page.getByRole("region", { name: content.vehicles.trip.title })).toBeVisible();
  });

  await test.step("Catalog: the trip total is shown and Book now carries the dates", async () => {
    const vios = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Toyota Vios" }) });
    await expect(vios).toContainText(content.vehicleCard.totalFor(3));
    await expect(vios).toContainText(formatCurrency(5400));
    await vios.getByRole("link", { name: content.vehicleCard.bookNow }).click();
  });

  await test.step("Step 1: dates and location are already filled in", async () => {
    await expect(page).toHaveURL(/\/book\/dates/);
    await expect(page.getByRole("heading", { level: 1, name: b.dates.title })).toBeVisible();
    await expect(page.getByLabel(b.dates.pickupLocation)).toHaveValue("Makati CBD");
    await page.getByRole("button", { name: b.common.continue }).click();
  });

  await test.step("Step 2: the chosen vehicle is selected and the total is shown", async () => {
    await expect(page).toHaveURL(/\/book\/vehicle/);
    const vios = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Toyota Vios" }) });
    await expect(vios.getByRole("button", { name: new RegExp(b.vehicle.selected) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // There are no add-ons to choose, only the vehicle.
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    // 3 days x 1,800 = 5,400.
    await expect(page.getByRole("region", { name: b.summary.title })).toContainText(formatCurrency(5400));
    await page.getByRole("link", { name: b.common.continue }).click();
  });

  await test.step("Step 3: empty details show errors, then valid details continue", async () => {
    await expect(page).toHaveURL(/\/book\/details/);
    await page.getByRole("button", { name: b.common.continue }).click();
    await expect(pageAlerts(page)).toHaveCount(4);
    await fillDetails(page);
  });

  await test.step("Step 4: the check step shows everything and charges nothing", async () => {
    await expect(page).toHaveURL(/\/book\/check/);
    await expect(page.getByRole("heading", { level: 1, name: b.check.title })).toBeVisible();
    const summary = page.getByRole("region", { name: b.summary.title });
    await expect(summary).toContainText("Lorenzo Buenaventura");
    await expect(summary).toContainText(formatCurrency(5400));
    await page.getByRole("link", { name: b.check.toPayment }).click();
  });

  await test.step("Step 5: the terms must be accepted before paying", async () => {
    await expect(page).toHaveURL(/\/book\/payment/);
    // Card numbers must never be asked for on this site.
    await expect(page.locator('input[autocomplete^="cc-"], input[inputmode="numeric"]')).toHaveCount(0);
    await expect(page.getByText(b.payment.cardNotice)).toBeVisible();

    await page.getByRole("button", { name: b.payment.pay(formatCurrency(5400)) }).click();
    await expect(pageAlerts(page).filter({ hasText: b.payment.termsError })).toBeVisible();
    await page.getByLabel(b.payment.terms).check();
  });

  await test.step("Step 5: a declined payment shows the failure and books nothing", async () => {
    await page.getByLabel(b.payment.demo.decline).check();
    await page.getByRole("button", { name: b.payment.pay(formatCurrency(5400)) }).click();
    await expect(page.getByRole("status").filter({ hasText: b.payment.processing })).toBeVisible();
    await expect(pageAlerts(page).filter({ hasText: b.payment.failedTitle })).toContainText(
      b.payment.failureReasons.declined,
    );
    await expect(page).toHaveURL(/\/book\/payment/);
    // Nothing was booked and no payment was recorded.
    expect(await savedCounts(page)).toEqual({ bookings: 15, payments: 15 });
  });

  await test.step("Step 5: trying again with a working payment pays and confirms in one go", async () => {
    await page.getByLabel(b.payment.demo.success).check();
    await page.getByRole("button", { name: b.payment.tryAgain }).click();
  });

  await test.step("Step 6: the confirmation shows a booking reference", async () => {
    await expect(page).toHaveURL(/\/book\/confirmation\/RC-[A-Z2-9]{6}$/);
    await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleConfirmed })).toBeVisible();
    await expect(page.getByText(/^RC-[A-Z2-9]{6}$/)).toBeVisible();
    await expect(page.getByRole("region", { name: b.summary.title })).toContainText(formatCurrency(5400));
    const progress = page.getByRole("navigation", { name: content.ui.stepper.label });
    await expect(progress.getByRole("listitem").filter({ hasText: b.steps.confirmation })).toHaveAttribute(
      "aria-current",
      "step",
    );
    // The booking is kept, so a reload still shows it.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleConfirmed })).toBeVisible();
  });

  await test.step("Booking is open: the same car can be booked again for the same dates", async () => {
    await visit(page, `/book/dates${tripQuery}&vehicle=toyota-vios-2024`);
    await page.getByRole("button", { name: b.common.continue }).click();
    await expect(page).toHaveURL(/\/book\/vehicle/);
    const vios = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Toyota Vios" }) });
    await expect(vios.getByRole("button", { name: b.vehicle.select })).toBeEnabled();
    await vios.getByRole("button", { name: b.vehicle.select }).click();
    await expect(page.getByRole("link", { name: b.common.continue })).toBeEnabled();
  });
});

test("a visitor can use a Google Maps link instead of typing an address", async ({ page }) => {
  await visit(page, "/book/dates");
  await page.getByLabel(b.dates.pickupLocation).fill("https://maps.app.goo.gl/abc123");
  await page.getByLabel(b.dates.differentReturn).click();
  await page.getByLabel(b.dates.returnLocation).fill("456 Sample St, Quezon City");
  await page.getByRole("button", { name: b.common.continue }).click();
  await expect(page).toHaveURL(/\/book\/vehicle/);

  await visit(page, "/book/dates");
  await expect(page.getByLabel(b.dates.pickupLocation)).toHaveValue("https://maps.app.goo.gl/abc123");
  await expect(page.getByLabel(b.dates.returnLocation)).toHaveValue("456 Sample St, Quezon City");
});

test("paying at pick-up leaves the booking pending", async ({ page }) => {
  await reachPayment(page, "toyota-wigo-2024", 30, 2);

  await page.getByRole("radio", { name: new RegExp(b.payment.methods.pay_at_pickup.label) }).check();
  await expect(page.getByText(b.payment.pickupNotice)).toBeVisible();
  // Nothing is charged, so the demo "decline" control is not offered.
  await expect(page.getByLabel(b.payment.demo.decline)).toHaveCount(0);
  await page.getByLabel(b.payment.terms).check();
  await page.getByRole("button", { name: b.payment.confirmPickup }).click();

  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
  await expect(page.getByText(content.enums.bookingStatus.pending, { exact: true })).toBeVisible();
});

test("later steps cannot be opened before the earlier ones are done", async ({ page }) => {
  for (const step of ["vehicle", "details", "check", "payment"]) {
    await visit(page, `/book/${step}`);
    await expect(page).toHaveURL(/\/book\/dates$/);
  }
});

test("a price change before paying charges nothing and asks the visitor to check again", async ({ page }) => {
  await reachPayment(page, "toyota-wigo-2024", 40, 2);
  await page.getByLabel(b.payment.terms).check();

  // The owner raises the Wigo's daily rate from 1,400 to 1,700 while the visitor is on this page.
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((name) => name.startsWith("car-rental-mock-db"))!;
    const db = JSON.parse(localStorage.getItem(key)!);
    db.vehicles.find((vehicle: { slug: string }) => vehicle.slug === "toyota-wigo-2024").pricePerDay = 1700;
    localStorage.setItem(key, JSON.stringify(db));
  });

  await page.getByRole("button", { name: b.payment.pay(formatCurrency(2800)) }).click();
  await expect(pageAlerts(page).filter({ hasText: b.payment.errors.price_changed.title })).toContainText(
    b.payment.errors.price_changed.body,
  );
  await expect(page).toHaveURL(/\/book\/payment/);

  // Nothing was charged and nothing was booked at the old price.
  expect(await savedCounts(page)).toEqual({ bookings: 15, payments: 15 });

  // The visitor checks the new total, then pays it.
  await page.getByRole("link", { name: b.payment.errors.price_changed.action }).click();
  await expect(page).toHaveURL(/\/book\/check/);
  await expect(page.getByRole("region", { name: b.summary.title })).toContainText(formatCurrency(3400));
  await page.getByRole("link", { name: b.check.toPayment }).click();
  await page.getByLabel(b.payment.terms).check();
  await page.getByRole("button", { name: b.payment.pay(formatCurrency(3400)) }).click();
  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleConfirmed })).toBeVisible();
  expect(await savedCounts(page)).toEqual({ bookings: 16, payments: 16 });
});
