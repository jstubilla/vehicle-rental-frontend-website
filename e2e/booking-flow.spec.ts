import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { formatCurrency } from "../src/lib/currency";
import { DRIVER_DAILY_RATE } from "../src/lib/pricing";
import { dateFromToday, loginAs, pageAlerts, uploadDocuments, visit } from "./helpers";

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
  await uploadDocuments(page);
  await page.getByRole("button", { name: b.common.continue }).click();
}

/** Jumps into the flow with the dates and vehicle in the link, then goes through steps 1 to 3. */
async function reachPayment(page: Page, slug: string, startInDays: number, nights: number, withDriver = false) {
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
  if (withDriver) await page.getByRole("radio", { name: new RegExp(b.driverOption.withDriver) }).check();
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
    const vios = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Sedan" }) });
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
    const vios = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Sedan" }) });
    await expect(vios.getByRole("button", { name: new RegExp(b.vehicle.selected) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The one choice besides the vehicle is the driver, and "Vehicle only" is the default.
    await expect(page.getByRole("checkbox")).toHaveCount(0);
    await expect(vios.getByRole("radio", { name: new RegExp(b.driverOption.vehicleOnly) })).toBeChecked();
    // 3 days x 1,800 = 5,400.
    const summary = page.getByRole("region", { name: b.summary.title });
    await expect(summary).toContainText(formatCurrency(5400));
    await expect(summary).toContainText(b.driverOption.vehicleOnly);
    await page.getByRole("link", { name: b.common.continue }).click();
  });

  await test.step("Step 3: empty details show errors, then valid details continue", async () => {
    await expect(page).toHaveURL(/\/book\/details/);
    await page.getByRole("button", { name: b.common.continue }).click();
    // Four fields plus the three document photos.
    await expect(pageAlerts(page)).toHaveCount(7);
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
    await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
    await expect(page.getByText(/^RC-[A-Z2-9]{6}$/)).toBeVisible();
    await expect(page.getByRole("region", { name: b.summary.title })).toContainText(formatCurrency(5400));
    const progress = page.getByRole("navigation", { name: content.ui.stepper.label });
    await expect(progress.getByRole("listitem").filter({ hasText: b.steps.confirmation })).toHaveAttribute(
      "aria-current",
      "step",
    );
    // The booking is kept, so a reload still shows it.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
  });

  await test.step("Booking is open: the same car can be booked again for the same dates", async () => {
    await visit(page, `/book/dates${tripQuery}&vehicle=sedan`);
    await page.getByRole("button", { name: b.common.continue }).click();
    await expect(page).toHaveURL(/\/book\/vehicle/);
    const vios = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Sedan" }) });
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

test("paying at pick-up takes a 10% down payment now and leaves the balance for pick-up", async ({ page }) => {
  // Hatchback at 1,600/day for 2 days = 3,200: 320 now, 2,880 at pick-up.
  await reachPayment(page, "hatchback", 30, 2);

  await page.getByRole("radio", { name: new RegExp(b.payment.methods.pay_at_pickup.label) }).check();
  await expect(page.getByRole("heading", { name: b.payment.downPayment.title })).toBeVisible();
  await page
    .getByRole("group", { name: b.payment.downPayment.methodLabel })
    .getByRole("radio", { name: b.payment.methods.gcash.label })
    .check();
  await page.getByLabel(b.payment.terms).check();
  await page.getByRole("button", { name: b.payment.payDownPayment(formatCurrency(320)) }).click();

  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
  await expect(page.getByText(b.confirmation.subtitlePending(formatCurrency(2880)))).toBeVisible();
});

test("staff check the customer's documents before the booking is confirmed", async ({ page }) => {
  await reachPayment(page, "hatchback", 30, 2);
  await page.getByLabel(b.payment.terms).check();
  await page.getByRole("button", { name: b.payment.pay(formatCurrency(3200)) }).click();
  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
  const reference = page.url().split("/").pop()!;

  const d = content.admin.bookings.detail;
  await loginAs(page);
  await visit(page, `/admin/bookings?q=${reference}`);
  await page.getByRole("link", { name: reference }).click();

  const documents = page.getByRole("region", { name: d.documents.title });
  await expect(documents.getByText(d.documents.status.pending)).toBeVisible();
  // Confirming is only offered through the documents.
  const status = page.getByRole("region", { name: d.status, exact: true });
  await expect(status.getByRole("button", { name: d.actions.confirmed })).toHaveCount(0);

  await documents.getByRole("button", { name: b.documents.view(b.documents.kinds.validId.label) }).click();
  await expect(page.getByRole("dialog").getByRole("img", { name: b.documents.kinds.validId.label })).toBeVisible();
  await page.keyboard.press("Escape");

  await documents.getByRole("button", { name: d.documents.approve }).click();
  await expect(documents.getByText(d.documents.status.verified)).toBeVisible();
  await expect(status.getByText(content.enums.bookingStatus.confirmed, { exact: true })).toBeVisible();
});

test("later steps cannot be opened before the earlier ones are done", async ({ page }) => {
  for (const step of ["vehicle", "details", "check", "payment"]) {
    await visit(page, `/book/${step}`);
    await expect(page).toHaveURL(/\/book\/dates$/);
  }
});

test("a price change before paying charges nothing and asks the visitor to check again", async ({ page }) => {
  await reachPayment(page, "hatchback", 40, 2);
  await page.getByLabel(b.payment.terms).check();

  // The owner raises the hatchback's daily rate from 1,600 to 1,700 while the visitor is on this page.
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((name) => name.startsWith("car-rental-mock-db"))!;
    const db = JSON.parse(localStorage.getItem(key)!);
    db.vehicles.find((vehicle: { slug: string }) => vehicle.slug === "hatchback").pricePerDay = 1700;
    localStorage.setItem(key, JSON.stringify(db));
  });

  await page.getByRole("button", { name: b.payment.pay(formatCurrency(3200)) }).click();
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
  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
  expect(await savedCounts(page)).toEqual({ bookings: 16, payments: 16 });
});

test("a visitor books a car With a driver, charged for every rental day", async ({ page }) => {
  // Sedan, 3 days: 5,400 for the vehicle + 1,000 x 3 for the driver = 8,400.
  const driverTotal = DRIVER_DAILY_RATE * 3;
  await reachPayment(page, "sedan", 20, 3, true);

  const summary = page.getByRole("region", { name: b.summary.title });
  await expect(summary).toContainText(b.driverOption.withDriver);
  await expect(summary).toContainText(b.summary.driverLine);
  await expect(summary).toContainText(b.summary.rate(formatCurrency(DRIVER_DAILY_RATE), 3));
  await expect(summary).toContainText(formatCurrency(driverTotal));

  await page.getByLabel(b.payment.terms).check();
  await page.getByRole("button", { name: b.payment.pay(formatCurrency(5400 + driverTotal)) }).click();

  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
  const confirmed = page.getByRole("region", { name: b.summary.title });
  await expect(confirmed).toContainText(b.driverOption.withDriver);
  await expect(confirmed).toContainText(formatCurrency(5400 + driverTotal));
});

test("motorcycles do not offer a driver", async ({ page }) => {
  const query = new URLSearchParams({
    pickupLocation: "NAIA Terminal 3, Pasay",
    pickupDate: dateFromToday(10),
    pickupTime: "10:00",
    returnDate: dateFromToday(12),
    returnTime: "10:00",
    vehicle: "125cc",
  });
  await visit(page, `/book/dates?${query}`);
  await page.getByRole("button", { name: b.common.continue }).click();
  await expect(page).toHaveURL(/\/book\/vehicle/);
  await expect(page.getByRole("radio", { name: new RegExp(b.driverOption.withDriver) })).toHaveCount(0);
  await expect(page.getByRole("region", { name: b.summary.title })).toContainText(b.driverOption.vehicleOnly);
});
