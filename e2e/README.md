# End-to-end tests

These tests open the real website in a real browser (Chromium) and click through it the way a
visitor or staff member would. They use [Playwright](https://playwright.dev), and
[axe](https://www.deque.com/axe/) for accessibility checks.

## Run them

First time only (downloads the test browser, about 115 MB):

```bash
npm run test:e2e:install
```

Then, any time:

```bash
npm run test:e2e
```

This builds the site, starts it on port 3100 (so it never clashes with `npm run dev` on port
3000), runs every test, and stops it again. It takes 2 to 4 minutes on a slow computer.

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
| `admin-access.spec.ts` | Login (wrong password, deactivated account, safe redirects), what each role (Admin, Sales, Accountant, Operations) can see and open, and logout |
| `accessibility.spec.ts` | An axe scan of every main page, every booking step, the admin pages, and states that change the page (error messages, open calendar, dialogs, phone menus) |

## How they stay reliable

- Every test starts in a brand-new browser, so it always begins with the original demo data and
  tests cannot affect each other.
- Tests read their wording from `src/content` and prices from `src/lib/currency`, so changing
  copy or prices does not break them.
- Shared helpers (`helpers.ts`) hold the login, page-loading and accessibility-scan code.

## When the designer's design arrives

Re-run the whole suite. The accessibility scan checks colour contrast, so it will tell you if the
new colours are too faint. If a test fails only because a button or label was renamed, update
`src/content` (the tests follow it), not the test.
