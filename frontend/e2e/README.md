# End-to-end tests

These tests open the real website in a real browser (Chromium) and click through it the way a
visitor or staff member would. They use [Playwright](https://playwright.dev), and
[axe](https://www.deque.com/axe/) for accessibility checks.

## Run them

The tests use a **local** Supabase database with the demo data, never a hosted project (they refuse to
run against anything that is not on this computer, because every test puts the demo data back). You
need Docker for it:

```bash
cd ../backend && npx supabase start   # first time: downloads Supabase's containers
npx supabase status -o env             # shows API_URL, ANON_KEY and SERVICE_ROLE_KEY
```

Put those in `frontend/.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` (the site under test and the tests both read it). The tests connect to the
database at `postgresql://postgres:postgres@127.0.0.1:54322/postgres` and read emailed login codes from
Mailpit at `http://127.0.0.1:54324` (the local stack's defaults; change them with `E2E_DB_URL` and
`E2E_MAILPIT_URL`).

First time only (downloads the test browser, about 115 MB):

```bash
npm run test:e2e:install
```

Then, any time:

```bash
npm run test:e2e
```

This builds the site, starts it on port 3100 (so it never clashes with `npm run dev` on port
3000), runs every test one at a time, and stops it again. It takes 10 to 15 minutes.

| Command | What it does |
| --- | --- |
| `npm run test:e2e` | Build, start, run all tests |
| `E2E_SKIP_BUILD=1 npm run test:e2e` | Same, but reuse the last build (faster while writing tests) |
| `npx playwright test e2e/contact-form.spec.ts` | Run one file |
| `npm run test:e2e:ui` | Open Playwright's visual test runner |
| `npm run test:e2e:report` | Open the report of the last run (screenshots and traces of failures) |

On Windows PowerShell, if `npm` is blocked, use `npm.cmd` instead, or set the environment
variable first: `$env:E2E_SKIP_BUILD=1; npm.cmd run test:e2e`.

## What is covered

| File | Covers |
| --- | --- |
| `booking-flow.spec.ts` | All six booking steps, a declined then a successful payment, pay-at-pick-up, the booked car being blocked for the same dates, the "price changed" safety net, and step guards |
| `contact-form.spec.ts` | Validation messages, the error and success states, preselecting a vehicle, and the message showing up as a New lead for staff |
| `admin-access.spec.ts` | Login (wrong password, deactivated account, safe redirects), the admin menu, and logout |
| `admin-management.spec.ts` | Bookings (status changes, cancelling, payments), vehicle prices reaching the public site, tasks, the pipeline (real mouse drag and the Move to menu), reports (numbers match the table), users (a new staff member is an admin, nobody can lock everyone out) |
| `keyboard.spec.ts` | Using only the keyboard: the skip link, contact form errors taking focus, the calendar (arrow keys, Escape), dialogs (focus stays inside, Escape closes and focus goes back to the button), the phone menu, and moving a pipeline card |
| `accessibility.spec.ts` | An axe scan of every main page, every booking step, all admin pages, and states that change the page (error messages, open calendar, dialogs, phone menus) |

## How they stay reliable

- Every test starts in a brand-new browser, and with the database put back to the demo data
  (`e2e/test.ts` does this before each test, in a fraction of a second), so tests cannot affect each
  other. That is also why they run one at a time.
- The demo data is `e2e/fixtures`; `../backend/supabase/seed.sql` is generated from it
  (`node scripts/generate-seed.mjs`), so the tests always know what the database holds. Fixture ids such
  as `cus-01` become fixed uuids in the database (`fixtureId()` in `e2e/db.ts`).
- Tests read their wording from `src/content` and prices from `src/lib/currency`, so changing
  copy or prices does not break them.
- Shared helpers (`helpers.ts`) hold the login, page-loading and accessibility-scan code.

## When the designer's design arrives

Re-run the whole suite. The accessibility scan checks colour contrast, so it will tell you if the
new colours are too faint. If a test fails only because a button or label was renamed, update
`src/content` (the tests follow it), not the test.
