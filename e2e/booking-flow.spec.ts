import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { formatCurrency } from "../src/lib/currency";
import { dateFromToday, pageAlerts, visit } from "./helpers";

const b = content.booking;

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
    pickupLocation: "loc-naia",
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
  await expect(page).toHaveURL(/\/book\/payment/);
}

test("a visitor completes all six steps, including a declined payment", async ({ page }) => {
  let tripQuery = "";

  await test.step("Home: search for a car", async () => {
    await visit(page, "/");
    await page.getByLabel(content.quickSearch.pickupLocation).selectOption({ label: "Makati CBD" });
    await page.getByRole("button", { name: content.quickSearch.submit }).click();
    await expect(page).toHaveURL(/\/vehicles\?.*pickupLocation=loc-makati/);
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
    await expect(page.getByLabel(b.dates.pickupLocation)).toHaveValue("loc-makati");
    await page.getByRole("button", { name: b.common.continue }).click();
  });

  await test.step("Step 2: the chosen vehicle is selected and extras change the price", async () => {
    await expect(page).toHaveURL(/\/book\/vehicle/);
    const vios = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Toyota Vios" }) });
    await expect(vios.getByRole("button", { name: new RegExp(b.vehicle.selected) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByLabel(/GPS navigation/).check();
    // 3 days x 1,800 + GPS 3 days x 200 = 6,000
    await expect(page.getByRole("region", { name: b.summary.title })).toContainText(formatCurrency(6000));
    await page.getByRole("link", { name: b.common.continue }).click();
  });

  await test.step("Step 3: empty details show errors, then valid details continue", async () => {
    await expect(page).toHaveURL(/\/book\/details/);
    await page.getByRole("button", { name: b.common.continue }).click();
    await expect(pageAlerts(page)).toHaveCount(4);
    await fillDetails(page);
  });

  await test.step("Step 4: a declined payment shows the failure and charges nothing", async () => {
    await expect(page).toHaveURL(/\/book\/payment/);
    // Card numbers must never be asked for on this site.
    await expect(page.locator('input[autocomplete^="cc-"], input[inputmode="numeric"]')).toHaveCount(0);
    await expect(page.getByText(b.payment.cardNotice)).toBeVisible();

    await page.getByLabel(b.payment.demo.decline).check();
    await page.getByRole("button", { name: b.payment.pay(formatCurrency(6000)) }).click();
    await expect(page.getByRole("status").filter({ hasText: b.payment.processing })).toBeVisible();
    await expect(pageAlerts(page).filter({ hasText: b.payment.failedTitle })).toContainText(
      b.payment.failureReasons.declined,
    );

    const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("car-rental-booking-flow")!).payment);
    expect(stored).toBeNull();
  });

  await test.step("Step 4: trying again with a working payment succeeds", async () => {
    await page.getByLabel(b.payment.demo.success).check();
    await page.getByRole("button", { name: b.payment.tryAgain }).click();
    await expect(page.getByRole("status").filter({ hasText: b.payment.successTitle })).toContainText(
      formatCurrency(6000),
    );
    await page.getByRole("link", { name: b.payment.continueToReview }).click();
  });

  await test.step("Step 5: the terms must be accepted before confirming", async () => {
    await expect(page).toHaveURL(/\/book\/review/);
    await expect(page.getByRole("region", { name: b.summary.title })).toContainText("Lorenzo Buenaventura");
    await page.getByRole("button", { name: b.review.confirm }).click();
    await expect(pageAlerts(page).filter({ hasText: b.review.termsError })).toBeVisible();
    await page.getByLabel(b.review.terms).check();
    await page.getByRole("button", { name: b.review.confirm }).click();
  });

  await test.step("Step 6: the confirmation shows a booking reference", async () => {
    await expect(page).toHaveURL(/\/book\/confirmation\/RC-[A-Z2-9]{6}$/);
    await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleConfirmed })).toBeVisible();
    await expect(page.getByText(/^RC-[A-Z2-9]{6}$/)).toBeVisible();
    await expect(page.getByRole("region", { name: b.summary.title })).toContainText(formatCurrency(6000));
    const progress = page.getByRole("navigation", { name: content.ui.stepper.label });
    await expect(progress.getByRole("listitem").filter({ hasText: b.steps.confirmation })).toHaveAttribute(
      "aria-current",
      "step",
    );
    // The booking is kept, so a reload still shows it.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleConfirmed })).toBeVisible();
  });

  await test.step("The same car cannot be booked again for the same dates", async () => {
    await visit(page, `/book/dates${tripQuery}&vehicle=toyota-vios-2024`);
    await page.getByRole("button", { name: b.common.continue }).click();
    await expect(page).toHaveURL(/\/book\/vehicle/);
    const vios = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Toyota Vios" }) });
    await expect(vios).toContainText(b.vehicle.unavailable);
    await expect(vios.getByRole("button")).toBeDisabled();
    await expect(page.getByText(b.vehicle.selectedUnavailable)).toBeVisible();
    await expect(page.getByRole("link", { name: b.common.continue })).toHaveCount(0);
  });
});

test("paying at pick-up leaves the booking pending", async ({ page }) => {
  await reachPayment(page, "toyota-wigo-2024", 30, 2);

  await page.getByRole("radio", { name: new RegExp(b.payment.methods.pay_at_pickup.label) }).check();
  await expect(page.getByText(b.payment.pickupNotice)).toBeVisible();
  // Nothing is charged, so the demo "decline" control is not offered.
  await expect(page.getByLabel(b.payment.demo.decline)).toHaveCount(0);
  await page.getByRole("button", { name: b.payment.choosePickup }).click();
  await expect(page.getByRole("status").filter({ hasText: b.payment.pickupTitle })).toBeVisible();
  await page.getByRole("link", { name: b.payment.continueToReview }).click();

  await page.getByLabel(b.review.terms).check();
  await page.getByRole("button", { name: b.review.confirm }).click();

  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
  await expect(page.getByText(content.enums.bookingStatus.pending, { exact: true })).toBeVisible();
});

test("later steps cannot be opened before the earlier ones are done", async ({ page }) => {
  for (const step of ["vehicle", "details", "payment", "review"]) {
    await visit(page, `/book/${step}`);
    await expect(page).toHaveURL(/\/book\/dates$/);
  }
});

test("a price change after paying sends the visitor back to pay again", async ({ page }) => {
  await reachPayment(page, "toyota-wigo-2024", 40, 2);
  await page.getByRole("button", { name: b.payment.pay(formatCurrency(2800)) }).click();
  await page.getByRole("link", { name: b.payment.continueToReview }).click();
  await expect(page).toHaveURL(/\/book\/review/);

  // The owner raises the Wigo's daily rate from 1,400 to 1,700 while the visitor is on this page.
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((name) => name.startsWith("car-rental-mock-db"))!;
    const db = JSON.parse(localStorage.getItem(key)!);
    db.vehicles.find((vehicle: { slug: string }) => vehicle.slug === "toyota-wigo-2024").pricePerDay = 1700;
    localStorage.setItem(key, JSON.stringify(db));
  });

  await page.getByLabel(b.review.terms).check();
  await page.getByRole("button", { name: b.review.confirm }).click();

  await expect(page).toHaveURL(/\/book\/payment/);
  // The notification is announced twice (once visibly, once for screen readers).
  await expect(page.getByText(b.review.errors.price_changed.title).first()).toBeVisible();
  await expect(page.getByRole("button", { name: b.payment.pay(formatCurrency(3400)) })).toBeVisible();

  // Nothing was booked at the old price.
  const bookingCount = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((name) => name.startsWith("car-rental-mock-db"))!;
    return JSON.parse(localStorage.getItem(key)!).bookings.length;
  });
  expect(bookingCount).toBe(15);
});
