import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests. They run against the PRODUCTION build (like a real visitor would
 * see), on port 3100 so they never clash with `npm run dev` on port 3000.
 *
 *   npm run test:e2e            builds the site, starts it, runs every test
 *   E2E_SKIP_BUILD=1 npm run test:e2e   reuse the last build (faster while writing tests)
 *
 * Every test gets a fresh browser, so it starts from the original demo data.
 */
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;
const start = `npx next start -p ${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "en-PH",
    timezoneId: "Asia/Manila",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.E2E_SKIP_BUILD ? start : `npm run build && ${start}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
