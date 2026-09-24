import { expect, test, type Locator, type Page } from "@playwright/test";
import { content } from "../src/content";
import { seedBookings } from "../src/mocks/bookings";
import { dateFromToday, expectNoA11yViolations, loginAs, pageAlerts, visit } from "./helpers";

/**
 * Accessibility scans (axe: WCAG 2.0, 2.1 and 2.2 levels A and AA, plus best practices).
 * A scan runs on every main page and on the states that change the page: error
 * messages, an open calendar, dialogs and the phone menus.
 */

const h1 = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });

interface PageCase {
  name: string;
  path: string;
  /** Something that is only visible once the page has finished loading its data. */
  ready: (page: Page) => Locator;
}

const PUBLIC_PAGES: PageCase[] = [
  { name: "Home", path: "/", ready: (p) => h1(p, content.home.hero.title) },
  {
    name: "Vehicle catalog",
    path: "/vehicles",
    ready: (p) => p.getByRole("article").first(),
  },
  {
    name: "Vehicle catalog with a trip and filters",
    path: `/vehicles?category=suv&pickupLocation=Makati+CBD&pickupDate=${dateFromToday(2)}&pickupTime=10%3A00&returnDate=${dateFromToday(5)}&returnTime=10%3A00`,
    ready: (p) => p.getByRole("region", { name: content.vehicles.trip.title }),
  },
  { name: "Vehicle details", path: "/vehicles/toyota-vios-2024", ready: (p) => h1(p, "Toyota Vios") },
  { name: "Special offers", path: "/special-offers", ready: (p) => h1(p, content.specialOffers.title) },
  { name: "About", path: "/about", ready: (p) => h1(p, content.about.title) },
  { name: "Contact", path: "/contact", ready: (p) => h1(p, content.contact.title) },
  { name: "Booking step 1: dates", path: "/book/dates", ready: (p) => h1(p, content.booking.dates.title) },
  { name: "Page not found", path: "/this-page-does-not-exist", ready: (p) => h1(p, content.states.notFoundTitle) },
];

for (const { name, path, ready } of PUBLIC_PAGES) {
  test(`${name} has no accessibility problems`, async ({ page }) => {
    await visit(page, path);
    await expect(ready(page)).toBeVisible();
    await expectNoA11yViolations(page);
  });
}

/** A half-finished booking, saved in the browser the way the real flow saves it. */
async function startWithBooking(page: Page) {
  await page.addInitScript(
    ({ pickup, ret }) => {
      sessionStorage.setItem(
        "car-rental-booking-flow",
        JSON.stringify({
          vehicleSlug: "toyota-vios-2024",
          rental: {
            pickupLocation: "NAIA Terminal 3, Pasay",
            returnLocation: "Makati CBD",
            pickupDate: pickup,
            pickupTime: "10:00",
            returnDate: ret,
            returnTime: "10:00",
          },
          customer: {
            name: "Lorenzo Buenaventura",
            email: "lorenzo.b@example.com",
            phone: "0917 555 0142",
            licenseNumber: "N21-25-778899",
            notes: "",
          },
        }),
      );
    },
    { pickup: dateFromToday(60), ret: dateFromToday(63) },
  );
}

test.describe("booking steps in progress", () => {
  test("step 2: vehicle", async ({ page }) => {
    await startWithBooking(page);
    await visit(page, "/book/vehicle");
    await expect(h1(page, content.booking.vehicle.title)).toBeVisible();
    await expect(page.getByRole("article").first()).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("step 3: your details, with error messages showing", async ({ page }) => {
    await startWithBooking(page);
    await visit(page, "/book/details");
    await expect(h1(page, content.booking.details.title)).toBeVisible();
    await page.getByLabel(content.booking.details.name).clear();
    await page.getByLabel(content.booking.details.email).clear();
    await page.getByLabel(content.booking.details.phone).clear();
    await page.getByLabel(content.booking.details.license).clear();
    await page.getByRole("button", { name: content.booking.common.continue }).click();
    await expect(pageAlerts(page).first()).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("step 4: check", async ({ page }) => {
    await startWithBooking(page);
    await visit(page, "/book/check");
    await expect(h1(page, content.booking.check.title)).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("step 5: payment, with the terms error and after a declined payment", async ({ page }) => {
    await startWithBooking(page);
    await visit(page, "/book/payment");
    await expect(h1(page, content.booking.payment.title)).toBeVisible();
    await expectNoA11yViolations(page);

    await page.getByRole("button", { name: /^Pay / }).click();
    await expect(pageAlerts(page).filter({ hasText: content.booking.payment.termsError })).toBeVisible();
    await expectNoA11yViolations(page);

    await page.getByLabel(content.booking.payment.terms).check();
    await page.getByLabel(content.booking.payment.demo.decline).check();
    await page.getByRole("button", { name: /^Pay / }).click();
    await expect(pageAlerts(page).filter({ hasText: content.booking.payment.failedTitle })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("step 6: confirmation", async ({ page }) => {
    await visit(page, `/book/confirmation/${seedBookings[0].reference}`);
    await expect(page.getByText(seedBookings[0].reference, { exact: true })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

test.describe("states that change the page", () => {
  test("contact form with every error message showing", async ({ page }) => {
    await visit(page, "/contact");
    await page.getByRole("button", { name: content.contact.form.submit }).click();
    await expect(pageAlerts(page)).toHaveCount(5);
    await expectNoA11yViolations(page);
  });

  test("calendar popup open on the home page search", async ({ page }) => {
    await visit(page, "/");
    await page.getByRole("button", { name: new RegExp(content.quickSearch.pickupDate) }).click();
    await expect(page.getByRole("grid")).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("phone menu open on the catalog", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await visit(page, "/vehicles");
    await page.getByRole("button", { name: content.ui.openMenu }).click();
    await expect(page.getByRole("button", { name: content.ui.closeMenu })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

test("admin login page has no accessibility problems", async ({ page }) => {
  await visit(page, "/admin/login");
  await expect(h1(page, content.admin.login.title)).toBeVisible();
  await expectNoA11yViolations(page);

  // With an error message showing.
  await page.getByRole("button", { name: content.admin.login.submit }).click();
  await expect(pageAlerts(page).first()).toBeVisible();
  await expectNoA11yViolations(page);
});

test.describe("admin area (signed in as Sales)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "Sales");
  });

  const ADMIN_PAGES: PageCase[] = [
    { name: "Dashboard", path: "/admin", ready: (p) => p.getByRole("heading", { name: content.admin.dashboard.recentActivity }) },
    { name: "Customer list", path: "/admin/customers", ready: (p) => p.getByRole("row").nth(1) },
    { name: "Customer profile", path: "/admin/customers/cus-05", ready: (p) => h1(p, "Mark Villanueva") },
    { name: "Lead list", path: "/admin/leads", ready: (p) => p.getByRole("row").nth(1) },
    { name: "Lead detail", path: "/admin/leads/lead-05", ready: (p) => h1(p, "Trisha Valdez") },
  ];

  for (const { name, path, ready } of ADMIN_PAGES) {
    test(`${name} has no accessibility problems`, async ({ page }) => {
      await visit(page, path);
      await expect(ready(page)).toBeVisible();
      await expect(page.getByRole("status", { name: content.admin.frame.loading })).toHaveCount(0);
      await expectNoA11yViolations(page);
    });
  }

  test("customer dialog open", async ({ page }) => {
    await visit(page, "/admin/customers");
    await page.getByRole("button", { name: content.admin.customers.add }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("lead dialog with error messages showing", async ({ page }) => {
    await visit(page, "/admin/leads");
    await page.getByRole("button", { name: content.admin.leads.add }).click();
    await page.getByRole("dialog").getByRole("button", { name: content.admin.common.save }).click();
    await expect(page.getByRole("dialog").getByRole("alert").first()).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("phone-sized admin menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await visit(page, "/admin/customers");
    await page.getByRole("button", { name: content.admin.frame.openMenu }).click();
    await expect(page.getByRole("button", { name: content.admin.frame.closeMenu })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

test("the 'no access' page has no accessibility problems", async ({ page }) => {
  await loginAs(page, "Accountant");
  await visit(page, "/admin/leads");
  await expect(h1(page, content.admin.forbidden.title)).toBeVisible();
  await expectNoA11yViolations(page);
});

test.describe("management pages (signed in as Admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "Admin");
  });

  const pendingBooking = seedBookings.find((booking) => booking.status === "pending")!;

  const MANAGEMENT_PAGES: PageCase[] = [
    { name: "Pipeline", path: "/admin/pipeline", ready: (p) => p.getByRole("region", { name: content.enums.leadStage.new, exact: true }).getByRole("listitem").first() },
    { name: "Task list", path: "/admin/tasks", ready: (p) => p.getByRole("row").nth(1) },
    { name: "Booking list", path: "/admin/bookings", ready: (p) => p.getByRole("row").nth(1) },
    { name: "Booking detail", path: `/admin/bookings/${pendingBooking.id}`, ready: (p) => h1(p, pendingBooking.reference) },
    { name: "Reports", path: "/admin/reports", ready: (p) => p.getByRole("figure").first() },
    { name: "Vehicle prices", path: "/admin/pricing", ready: (p) => p.getByRole("row").nth(1) },
    { name: "Users", path: "/admin/users", ready: (p) => p.getByRole("row").nth(1) },
    { name: "Roles", path: "/admin/roles", ready: (p) => p.getByRole("row").nth(1) },
  ];

  for (const { name, path, ready } of MANAGEMENT_PAGES) {
    test(`${name} has no accessibility problems`, async ({ page }) => {
      await visit(page, path);
      await expect(ready(page)).toBeVisible();
      await expect(page.getByRole("status", { name: content.admin.frame.loading })).toHaveCount(0);
      await expectNoA11yViolations(page);
    });
  }

  test("reports with the table view open", async ({ page }) => {
    await visit(page, "/admin/reports");
    await expect(page.getByRole("figure").first()).toBeVisible();
    for (const tab of await page.getByRole("tab", { name: content.admin.reports.tabs.table }).all()) await tab.click();
    await expect(page.getByRole("table").first()).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("price dialog with an error message", async ({ page }) => {
    await visit(page, "/admin/pricing");
    await page.getByRole("row", { name: /Toyota Vios/ }).getByRole("button", { name: content.admin.pricing.change }).click();
    await page.getByRole("dialog").getByLabel(content.admin.pricing.rateLabel).fill("abc");
    await page.getByRole("dialog").getByRole("button", { name: content.admin.common.save }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("role dialog with the permission checkboxes", async ({ page }) => {
    await visit(page, "/admin/roles");
    await page.getByRole("button", { name: content.admin.roles.add }).click();
    await expect(page.getByRole("dialog").getByRole("group").first()).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: content.admin.common.save }).click();
    await expect(page.getByRole("dialog").getByRole("alert").first()).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("task dialog and user dialog", async ({ page }) => {
    await visit(page, "/admin/tasks");
    await page.getByRole("button", { name: content.admin.tasks.add }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoA11yViolations(page);

    await visit(page, "/admin/users");
    await page.getByRole("button", { name: content.admin.users.add }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

test.describe("dark mode", () => {
  /** Starts the browser with dark mode already chosen, the way a returning visitor would have it. */
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem("car-rental-theme")) localStorage.setItem("car-rental-theme", "dark");
    });
  });

  test("the toggle switches the theme, and the choice survives a reload", async ({ page }) => {
    await visit(page, "/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: content.ui.theme.toggleToLight }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("cards are light with dark text, and the page around them is dark", async ({ page }) => {
    await visit(page, "/vehicles");
    const card = page.getByRole("article").first();
    await expect(card).toBeVisible();
    const colors = await card.evaluate((el) => {
      const price = el.querySelector(".text-price")!;
      return {
        page: getComputedStyle(document.body).backgroundColor,
        card: getComputedStyle(el).backgroundColor,
        text: getComputedStyle(el).color,
        price: getComputedStyle(price).color,
      };
    });
    expect(colors.page).toBe("rgb(1, 17, 37)"); // #011125
    expect(colors.card).toBe("rgb(222, 228, 235)"); // #dee4eb
    expect(colors.text).toBe("rgb(12, 35, 61)"); // #0c233d
    expect(colors.price).toBe("rgb(168, 67, 0)"); // darker orange: brand orange is unreadable on a light card
  });

  const PUBLIC: PageCase[] = [
    { name: "Home", path: "/", ready: (p) => h1(p, content.home.hero.title) },
    { name: "Vehicle catalog", path: "/vehicles", ready: (p) => p.getByRole("article").first() },
    { name: "Vehicle details", path: "/vehicles/toyota-vios-2024", ready: (p) => h1(p, "Toyota Vios") },
    { name: "Special offers", path: "/special-offers", ready: (p) => h1(p, content.specialOffers.title) },
    { name: "Contact", path: "/contact", ready: (p) => h1(p, content.contact.title) },
    { name: "Booking step 1", path: "/book/dates", ready: (p) => h1(p, content.booking.dates.title) },
    { name: "Admin login", path: "/admin/login", ready: (p) => h1(p, content.admin.login.title) },
  ];
  for (const { name, path, ready } of PUBLIC) {
    test(`${name} has no accessibility problems in dark mode`, async ({ page }) => {
      await visit(page, path);
      await expect(ready(page)).toBeVisible();
      await expectNoA11yViolations(page);
    });
  }

  test("booking steps 4 and 5 (summary card, payment cards, orange button)", async ({ page }) => {
    await startWithBooking(page);
    await visit(page, "/book/check");
    await expect(h1(page, content.booking.check.title)).toBeVisible();
    await expectNoA11yViolations(page);
    await visit(page, "/book/payment");
    await expect(h1(page, content.booking.payment.title)).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole("button", { name: /^Pay / }).click();
    await expect(pageAlerts(page).first()).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("the phone menu and the calendar popup", async ({ page }) => {
    await visit(page, "/");
    await page.getByRole("button", { name: new RegExp(content.quickSearch.pickupDate) }).click();
    await expect(page.getByRole("grid")).toBeVisible();
    await expectNoA11yViolations(page);
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("button", { name: content.ui.openMenu }).click();
    await expectNoA11yViolations(page);
  });

  test.describe("admin", () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, "Admin");
    });

    test("dashboard, tables, pipeline and reports", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expectNoA11yViolations(page);
      for (const [path, ready] of [
        ["/admin/customers", (p: Page) => p.getByRole("row").nth(1)],
        ["/admin/bookings", (p: Page) => p.getByRole("row").nth(1)],
        ["/admin/pipeline", (p: Page) => p.getByRole("region", { name: content.enums.leadStage.new, exact: true }).getByRole("listitem").first()],
        ["/admin/reports", (p: Page) => p.getByRole("figure").first()],
        ["/admin/pricing", (p: Page) => p.getByRole("row").nth(1)],
        ["/admin/users", (p: Page) => p.getByRole("row").nth(1)],
      ] as const) {
        await visit(page, path);
        await expect(ready(page)).toBeVisible();
        await expectNoA11yViolations(page);
      }
    });

    test("dialogs with errors, and a booking detail", async ({ page }) => {
      await visit(page, "/admin/customers");
      await page.getByRole("button", { name: content.admin.customers.add }).click();
      await page.getByRole("dialog").getByRole("button", { name: content.admin.common.save }).click();
      await expect(page.getByRole("dialog").getByRole("alert").first()).toBeVisible();
      await expectNoA11yViolations(page);

      await visit(page, "/admin/roles");
      await page.getByRole("button", { name: content.admin.roles.add }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectNoA11yViolations(page);

      const pending = seedBookings.find((booking) => booking.status === "pending")!;
      await visit(page, `/admin/bookings/${pending.id}`);
      await expect(h1(page, pending.reference)).toBeVisible();
      await expectNoA11yViolations(page);
    });
  });
});
