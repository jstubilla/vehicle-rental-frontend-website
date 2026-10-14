import { test as base } from "@playwright/test";
import { resetDatabase } from "./db";

/**
 * Playwright's `test`, plus: every test starts from the demo data (backend/supabase/seed.sql), as if
 * the database had just been set up. Import `test` and `expect` from here in every spec.
 */
export const test = base.extend<{ freshDatabase: void }>({
  freshDatabase: [
    async ({}, use) => {
      await resetDatabase();
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
export type { Locator, Page } from "@playwright/test";
