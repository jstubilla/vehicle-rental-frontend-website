import { expect, test } from "@playwright/test";
import { content } from "../src/content";
import { VEHICLE_CATEGORIES } from "../src/lib/constants";
import { seedVehicles } from "../src/mocks/vehicles";
import { expectNoA11yViolations, visit } from "./helpers";

test("the catalog lists types of vehicle, each with an example that says 'or similar'", async ({ page }) => {
  await visit(page, "/vehicles");
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(seedVehicles.length);
  for (const vehicle of seedVehicles) {
    const card = cards.filter({ has: page.getByRole("heading", { name: vehicle.name, exact: true }) });
    await expect(card).toContainText(vehicle.examples);
    await expect(card).toContainText("or similar");
  }
  // No plate numbers or model years: these are types, not particular cars.
  await expect(page.getByRole("main").getByText(/\b20\d\d\b/)).toHaveCount(0);
});

test("the type filter offers every type, and picking one narrows the list", async ({ page }) => {
  await visit(page, "/vehicles");
  const filter = page.getByLabel(content.vehicles.filters.category);
  const options = await filter.locator("option").allTextContents();
  for (const category of VEHICLE_CATEGORIES) expect(options).toContain(content.enums.vehicleCategory[category]);

  await filter.selectOption("pickup");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("article")).toContainText("Toyota Hilux or similar");
});

test("a type's page shows its example and the most it seats", async ({ page }) => {
  await visit(page, "/vehicles/mpv");
  await expect(page.getByRole("heading", { level: 1, name: "Multi-purpose vehicle (MPV)" })).toBeVisible();
  await expect(page.getByText("Mitsubishi Xpander or similar")).toBeVisible();
  await expect(page.getByText(content.vehicleDetail.upTo(8))).toBeVisible();
  await expectNoA11yViolations(page);
});
