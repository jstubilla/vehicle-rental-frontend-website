import { expect, test, type Page } from "@playwright/test";
import { content } from "../src/content";
import { formatCurrency } from "../src/lib/currency";
import { DRIVER_DAILY_RATE, splitDownPayment } from "../src/lib/pricing";
import {
  addApprovedBooking,
  dateFromToday,
  loginAs,
  openOwnBooking,
  pageAlerts,
  uploadDocuments,
  visit,
} from "./helpers";

const b = content.booking;
const d = content.admin.bookings.detail;
const EMAIL = "lorenzo.b@example.com";

/** How many bookings and payments the fake database holds right now. */
const savedCounts = (page: Page) =>
  page.evaluate(() => {
    const key = Object.keys(localStorage).find((name) => name.startsWith("car-rental-mock-db"))!;
    const db = JSON.parse(localStorage.getItem(key)!);
    return { bookings: db.bookings.length, payments: db.payments.length };
  });

/** Step 3: driver details and document photos. */
async function fillDetails(page: Page) {
  await page.getByLabel(b.details.name).fill("Lorenzo Buenaventura");
  await page.getByLabel(b.details.email).fill(EMAIL);
  await page.getByLabel(b.details.phone).fill("0917 555 0142");
  await page.getByLabel(b.details.license).fill("N21-25-778899");
  await uploadDocuments(page);
  await page.getByRole("button", { name: b.common.continue }).click();
}

/** Jumps into the flow with the dates and vehicle in the link, then goes through steps 1 to 4. */
async function reachSubmit(page: Page, slug: string, startInDays: number, nights: number, withDriver = false) {
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
  await page.getByRole("link", { name: b.check.toSubmit }).click();
  await expect(page).toHaveURL(/\/book\/submit/);
}

/** Sends the request on step 5 and returns the booking reference from the confirmation page. */
async function sendRequest(page: Page): Promise<string> {
  await page.getByLabel(b.payment.terms).check();
  await page.getByRole("button", { name: b.submit.send }).click();
  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
  return page.url().split("/").pop()!;
}

/** Signs in as staff (unless already signed in) and opens the booking. */
async function openAsStaff(page: Page, reference: string, signIn = true) {
  if (signIn) await loginAs(page);
  await visit(page, `/admin/bookings?q=${reference}`);
  await page.getByRole("link", { name: reference }).click();
  await expect(page.getByRole("heading", { level: 1, name: reference })).toBeVisible();
}

test("a visitor sends a booking request in five steps, and nothing is charged", async ({ page }) => {
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

  await test.step("Step 4: the check step shows everything, including the photos", async () => {
    await expect(page).toHaveURL(/\/book\/check/);
    await expect(page.getByRole("heading", { level: 1, name: b.check.title })).toBeVisible();
    const summary = page.getByRole("region", { name: b.summary.title });
    await expect(summary).toContainText("Lorenzo Buenaventura");
    await expect(summary).toContainText(formatCurrency(5400));
    await expect(page.getByRole("button", { name: b.documents.view(b.documents.kinds.driversLicense.label) })).toBeVisible();
    await page.getByRole("link", { name: b.check.toSubmit }).click();
  });

  await test.step("Step 5: the terms must be accepted, and no payment is asked for", async () => {
    await expect(page).toHaveURL(/\/book\/submit/);
    await expect(page.getByRole("radio")).toHaveCount(0);
    await page.getByRole("button", { name: b.submit.send }).click();
    await expect(pageAlerts(page).filter({ hasText: b.payment.termsError })).toBeVisible();
    await sendRequest(page);
  });

  await test.step("Step 6: the request is saved, pending, with nothing paid", async () => {
    await expect(page).toHaveURL(/\/book\/confirmation\/RC-[A-Z2-9]{6}$/);
    await expect(page.getByText(b.confirmation.subtitlePending)).toBeVisible();
    await expect(page.getByText(/^RC-[A-Z2-9]{6}$/)).toBeVisible();
    await expect(page.getByText(content.enums.bookingStatus.pending, { exact: true })).toBeVisible();
    const progress = page.getByRole("navigation", { name: content.ui.stepper.label });
    await expect(progress.getByRole("listitem").filter({ hasText: b.steps.confirmation })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(await savedCounts(page)).toEqual({ bookings: 16, payments: 15 });
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

test("staff approve the documents, then the customer pays and the booking is confirmed", async ({ page }) => {
  await reachSubmit(page, "hatchback", 30, 2);
  const reference = await sendRequest(page);

  await test.step("Staff: confirming is only possible through the documents", async () => {
    await openAsStaff(page, reference);
    const documents = page.getByRole("region", { name: d.documents.title });
    await expect(documents.getByText(d.documents.status.pending)).toBeVisible();
    const status = page.getByRole("region", { name: d.status, exact: true });
    await expect(status.getByRole("button", { name: d.actions.confirmed })).toHaveCount(0);

    await documents.getByRole("button", { name: b.documents.view(b.documents.kinds.validId.label) }).click();
    await expect(page.getByRole("dialog").getByRole("img", { name: b.documents.kinds.validId.label })).toBeVisible();
    await page.keyboard.press("Escape");

    await documents.getByRole("button", { name: d.documents.approve }).click();
    await expect(documents.getByText(d.documents.status.verified)).toBeVisible();
    await expect(status.getByText(content.enums.bookingStatus.approved, { exact: true })).toBeVisible();
    await expect(status.getByRole("link", { name: `/book/pay/${reference}` })).toBeVisible();
  });

  await test.step("Customer: the status page offers Pay now", async () => {
    await visit(page, `/book/confirmation/${reference}`);
    await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleApproved })).toBeVisible();
    await page.getByRole("link", { name: b.confirmation.payNow }).click();
    await expect(page).toHaveURL(new RegExp(`/book/pay/${reference}$`));
  });

  await test.step("Pay page: the wrong email shows nothing", async () => {
    await page.getByLabel(b.access.email).fill("someone.else@example.com");
    await page.getByRole("button", { name: b.access.continue }).click();
    await expect(pageAlerts(page).filter({ hasText: b.access.notFound })).toBeVisible();
  });

  await test.step("Pay page: a declined payment charges nothing, then a working one confirms", async () => {
    await page.getByLabel(b.access.email).fill(EMAIL);
    await page.getByRole("button", { name: b.access.continue }).click();
    await expect(page.getByRole("heading", { level: 1, name: b.payment.title })).toBeVisible();
    // Card numbers must never be asked for on this site.
    await expect(page.locator('input[autocomplete^="cc-"], input[inputmode="numeric"]')).toHaveCount(0);
    await expect(page.getByText(b.payment.cardNotice)).toBeVisible();

    await page.getByLabel(b.payment.terms).check();
    await page.getByLabel(b.payment.demo.decline).check();
    await page.getByRole("button", { name: b.payment.pay(formatCurrency(3200)) }).click();
    await expect(pageAlerts(page).filter({ hasText: b.payment.failedTitle })).toContainText(
      b.payment.failureReasons.declined,
    );
    expect((await savedCounts(page)).payments).toBe(15);

    await page.getByLabel(b.payment.demo.success).check();
    await page.getByRole("button", { name: b.payment.tryAgain }).click();
    await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleConfirmed })).toBeVisible();
    await expect(page.getByText(content.enums.bookingStatus.confirmed, { exact: true })).toBeVisible();
    // Paid: there is no refund policy, so it can no longer be cancelled online.
    await expect(page.getByRole("button", { name: b.cancel.open })).toHaveCount(0);
  });

  await test.step("A paid booking cannot be paid again", async () => {
    await openOwnBooking(page, `/book/pay/${reference}`, EMAIL);
    await expect(page.getByRole("heading", { level: 1, name: b.pay.paidTitle })).toBeVisible();
  });
});

test("the dashboard counts documents to check and links to them", async ({ page }) => {
  const dash = content.admin.dashboard;
  await reachSubmit(page, "hatchback", 32, 2);
  const reference = await sendRequest(page);

  await loginAs(page);
  await visit(page, "/admin");
  const card = page.getByRole("article").filter({ hasText: dash.cards.documentsToCheck });
  await expect(card).toContainText("1");
  await expect(card).toContainText(dash.cardHints.documentsToCheck(1));

  await card.getByRole("link", { name: dash.cards.documentsToCheck }).click();
  await expect(page).toHaveURL(/\/admin\/bookings\?docs=to_check/);
  // Only the request waiting for a check is listed, not the other pending bookings.
  await expect(page.getByRole("status").filter({ hasText: content.admin.common.showingRange(1, 1, 1) })).toBeVisible();
  await page.getByRole("link", { name: reference }).click();
  await page.getByRole("region", { name: d.documents.title }).getByRole("button", { name: d.documents.approve }).click();
  await expect(page.getByRole("region", { name: d.status, exact: true }).getByText(content.enums.bookingStatus.approved, { exact: true })).toBeVisible();

  await visit(page, "/admin");
  await expect(card).toContainText(dash.cardHints.documentsToCheck(0));
});

test("rejected documents: the customer sees the reason and sends new photos", async ({ page }) => {
  await reachSubmit(page, "hatchback", 35, 2);
  const reference = await sendRequest(page);
  const reason = "The photo of your ID is blurry. Please send a clearer one.";

  await openAsStaff(page, reference);
  const documents = page.getByRole("region", { name: d.documents.title });
  await documents.getByRole("button", { name: d.documents.reject }).click();
  const dialog = page.getByRole("dialog");
  // A reason is required, because the customer is shown it.
  await dialog.getByRole("button", { name: d.documents.rejectConfirm }).click();
  await expect(dialog.getByText(d.documents.reasonRequired)).toBeVisible();
  await dialog.getByLabel(d.documents.reasonLabel).fill(reason);
  await dialog.getByRole("button", { name: d.documents.rejectConfirm }).click();
  await expect(documents.getByText(d.documents.status.rejected)).toBeVisible();
  await expect(documents).toContainText(reason);

  await visit(page, `/book/confirmation/${reference}`);
  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleRejected })).toBeVisible();
  await expect(page.getByText(reason)).toBeVisible();
  await page.getByRole("link", { name: b.confirmation.sendNewPhotos }).click();

  await page.getByLabel(b.access.email).fill(EMAIL);
  await page.getByRole("button", { name: b.access.continue }).click();
  await expect(page.getByRole("heading", { level: 1, name: b.resubmit.title })).toBeVisible();
  await expect(page.getByText(reason)).toBeVisible();
  await uploadDocuments(page);
  await page.getByRole("button", { name: b.resubmit.send }).click();

  // Back to waiting for staff to check.
  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titlePending })).toBeVisible();
  await openAsStaff(page, reference, false);
  await expect(page.getByRole("region", { name: d.documents.title }).getByText(d.documents.status.pending)).toBeVisible();
});

test("a customer can cancel an unpaid booking, giving a reason", async ({ page }) => {
  await reachSubmit(page, "hatchback", 38, 2);
  const reference = await sendRequest(page);
  const reason = "My travel plans changed.";

  await page.getByRole("button", { name: b.cancel.open }).click();
  const dialog = page.getByRole("dialog");
  // A reason and the booking email are required.
  await dialog.getByRole("button", { name: b.cancel.confirm }).click();
  await expect(dialog.getByText(b.cancel.reasonRequired)).toBeVisible();
  await dialog.getByLabel(b.cancel.reasonLabel).fill(reason);
  await dialog.getByLabel(b.cancel.emailLabel).fill("someone.else@example.com");
  await dialog.getByRole("button", { name: b.cancel.confirm }).click();
  await expect(dialog.getByText(b.cancel.errors.not_found)).toBeVisible();

  await dialog.getByLabel(b.cancel.emailLabel).fill(EMAIL);
  await dialog.getByRole("button", { name: b.cancel.confirm }).click();
  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleCancelled })).toBeVisible();
  await expect(page.getByText(b.confirmation.subtitleCancelledByYou)).toBeVisible();
  await expect(page.getByRole("button", { name: b.cancel.open })).toHaveCount(0);

  // Staff see who cancelled and why.
  await openAsStaff(page, reference);
  const status = page.getByRole("region", { name: d.status, exact: true });
  await expect(status.getByText(content.enums.bookingStatus.cancelled, { exact: true })).toBeVisible();
  await expect(status).toContainText(d.cancelledByCustomer);
  await expect(status).toContainText(reason);
});

test("paying at pick-up takes a 10% down payment now and leaves the balance for pick-up", async ({ page }) => {
  const { reference, email, total } = await addApprovedBooking(page);
  const { downPayment, balance } = splitDownPayment(total);
  await openOwnBooking(page, `/book/pay/${reference}`, email);

  await page.getByRole("radio", { name: new RegExp(b.payment.methods.pay_at_pickup.label) }).check();
  await expect(page.getByRole("heading", { name: b.payment.downPayment.title })).toBeVisible();
  await page
    .getByRole("group", { name: b.payment.downPayment.methodLabel })
    .getByRole("radio", { name: b.payment.methods.gcash.label })
    .check();
  await page.getByLabel(b.payment.terms).check();
  await page.getByRole("button", { name: b.payment.payDownPayment(formatCurrency(downPayment)) }).click();

  await expect(page.getByRole("heading", { level: 1, name: b.confirmation.titleConfirmed })).toBeVisible();
  await expect(page.getByText(b.confirmation.subtitleDownPayment(formatCurrency(balance)))).toBeVisible();
});

test("later steps cannot be opened before the earlier ones are done", async ({ page }) => {
  for (const step of ["vehicle", "details", "check", "submit"]) {
    await visit(page, `/book/${step}`);
    await expect(page).toHaveURL(/\/book\/dates$/);
  }
});

test("a price change before sending books nothing and asks the visitor to check again", async ({ page }) => {
  await reachSubmit(page, "hatchback", 40, 2);
  await page.getByLabel(b.payment.terms).check();

  // The owner raises the hatchback's daily rate from 1,600 to 1,700 while the visitor is on this page.
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((name) => name.startsWith("car-rental-mock-db"))!;
    const db = JSON.parse(localStorage.getItem(key)!);
    db.vehicles.find((vehicle: { slug: string }) => vehicle.slug === "hatchback").pricePerDay = 1700;
    localStorage.setItem(key, JSON.stringify(db));
  });

  await page.getByRole("button", { name: b.submit.send }).click();
  await expect(pageAlerts(page).filter({ hasText: b.submit.errors.price_changed.title })).toContainText(
    b.submit.errors.price_changed.body,
  );
  await expect(page).toHaveURL(/\/book\/submit/);
  expect(await savedCounts(page)).toEqual({ bookings: 15, payments: 15 });

  // The visitor checks the new total, then sends the request at it.
  await page.getByRole("link", { name: b.submit.errors.price_changed.action }).click();
  await expect(page).toHaveURL(/\/book\/check/);
  await expect(page.getByRole("region", { name: b.summary.title })).toContainText(formatCurrency(3400));
  await page.getByRole("link", { name: b.check.toSubmit }).click();
  await sendRequest(page);
  await expect(page.getByRole("region", { name: b.summary.title })).toContainText(formatCurrency(3400));
  expect(await savedCounts(page)).toEqual({ bookings: 16, payments: 15 });
});

test("a visitor books a car With a driver, charged for every rental day", async ({ page }) => {
  // Sedan, 3 days: 5,400 for the vehicle + 1,000 x 3 for the driver = 8,400.
  const driverTotal = DRIVER_DAILY_RATE * 3;
  await reachSubmit(page, "sedan", 20, 3, true);

  const summary = page.getByRole("region", { name: b.summary.title });
  await expect(summary).toContainText(b.driverOption.withDriver);
  await expect(summary).toContainText(b.summary.driverLine);
  await expect(summary).toContainText(b.summary.rate(formatCurrency(DRIVER_DAILY_RATE), 3));
  await expect(summary).toContainText(formatCurrency(driverTotal));

  await sendRequest(page);
  const saved = page.getByRole("region", { name: b.summary.title });
  await expect(saved).toContainText(b.driverOption.withDriver);
  await expect(saved).toContainText(formatCurrency(5400 + driverTotal));
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
