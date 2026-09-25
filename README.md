# Car Rental Co. — front-end skeleton

A car rental website for **one company**, with a booking flow for visitors and a built-in admin area
(a small CRM) for staff. This is the **front end only**:

- **No backend.** All data is fake ("mock") and lives in your browser. Everything is built so the mock
  can be swapped for a real API later without touching the screens (see [section 5](#5-swapping-the-mocks-for-a-real-api)).
- **Grayscale wireframe.** The look is a placeholder until the designer's design arrives. The look and
  the function are kept separate, so the design can be applied without breaking anything. See
  [`docs/DESIGN-HANDOFF.md`](docs/DESIGN-HANDOFF.md).

Built with Next.js (App Router), TypeScript, Tailwind CSS, Radix UI, React Hook Form and Zod, and
TanStack Query. Currency is Philippine pesos (PHP) and times are Manila time.

---

## 1. Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

> **Windows PowerShell says "running scripts is disabled"?** Use `npm.cmd` instead of `npm`
> (for example `npm.cmd run dev`), or run the commands in Command Prompt.

Optional: copy `.env.example` to `.env.local` to change the settings in
[section 8](#8-settings-environment-variables).

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the site while you work (port 3000). Changes show up as you save. |
| `npm run build` then `npm start` | Build and run the fast production version |
| `npm run verify` | The full check: types, lint, design-token check, then build. **Run before every commit.** |
| `npm run typecheck` | Type errors only |
| `npm run lint` | Code style problems only |
| `npm run check:tokens` | Fails if a color or size is typed outside the design tokens |
| `npm run test:e2e` | Automated browser tests (see [`e2e/README.md`](e2e/README.md)) |

### Things to look at

| Address | What you will find |
| --- | --- |
| `/` | Public home page |
| `/vehicles` | Catalog with filters |
| `/book/dates` | The six-step booking flow |
| `/contact` | Contact form (each message becomes a lead in the admin) |
| `/review` | Leave a review (private; staff choose which ones show on the home page) |
| `/login`, `/signup` | Customer accounts (mock). A signed-in customer is asked whether to fill in their saved details when booking |
| `/admin` | Admin area (sign in first) |
| `/styleguide` | Every reusable component in one page (for developers) |

### Signing in to the admin

The login page lists the demo admin account. Every staff account is an **admin** and can do everything:
there are no roles or permissions. All staff accounts use the password **`demo1234`**.

The demo accounts and the payment "demo controls" only show while `NEXT_PUBLIC_SHOW_MOCK_CONTROLS` is not
`false`.

---

## 2. What is in it

**Public site:** home page with quick search, vehicle catalog and detail pages, a special offers page,
about page, contact form, and a six-step booking flow (dates and place, vehicle, driver details, check,
payment, confirmation) with a **mock payment** that can succeed or be declined. The last step pays and
confirms the booking in one action. Booking is open — every vehicle can be booked for any dates.

**Admin area:** dashboard, customers, leads, a drag-and-drop pipeline, tasks, bookings, reports,
vehicle pricing, customer reviews and staff users. The complete list of
pages and components is in [`docs/DESIGN-HANDOFF.md`](docs/DESIGN-HANDOFF.md).

**How it stays organized.** Three layers, and a file only belongs in one of them:

| Layer | Where | What it may contain |
| --- | --- | --- |
| **Logic** | `src/features/*/hooks`, `src/api`, `src/lib`, `src/mocks` | Data, forms, rules. **No styling at all.** |
| **UI kit** | `src/components/ui` | The only place where things get their look. Every value comes from `src/styles/tokens.css`. |
| **Pages** | `src/app`, `src/features/*/components` | Layout only: what goes where. |

Other folders worth knowing:

| Folder | Purpose |
| --- | --- |
| `src/content/index.ts` | **All wording.** Nothing else contains text that visitors read. |
| `src/assets/config.ts` | The logo and every image |
| `src/mocks` | The fake data (8 vehicle types, 20 customers, 15 bookings, 15 leads, and more) |
| `src/api` | The only door to the data. Every function is `async`, like a real API. |
| `src/proxy.ts` | Guards `/admin` (Next.js 16 calls this file a "proxy"; older versions call it "middleware") |
| `e2e` | The automated browser tests |
| `docs` | The design handoff guide |

---

## 3. Changing the look (theme)

Open **`src/styles/tokens.css`**. Every color, font, size, corner radius, shadow and spacing value in the
whole site is defined there once, with a comment. Change a value and the whole site follows:

```css
--accent: #fd802b;   /* try a different orange and every call-to-action button changes */
```

Colors have two layers: plain semantic variables (`--bg-main`, `--card`, `--text-primary`, `--primary`,
`--accent` ...) written once per theme, and Tailwind names (`bg-background`, `text-foreground` ...) that
just point at them. Only the first layer ever holds a color.

**Light and dark mode are both live.** The light values are the base block at the top of the file; the
dark ones are in `[data-theme="dark"]` (only the values that change need to be listed). In dark mode
cards are light with dark text: card-like components carry `data-surface="card"`, which switches the light
values back on inside them. The comment at the top of `tokens.css` lists the measured contrast results and
which colors were added because the brand palette did not have them. A `ThemeToggle` button (top right of every page, public and admin) switches between them; the
choice is remembered per browser (`src/lib/theme.ts`), and a small inline script in
`src/app/layout.tsx` applies it before the page paints, so there is no flash of the wrong theme.

How things *look* (padding, borders, hover) is in `src/components/ui`. Pages never contain colors. The
command `npm run check:tokens` enforces this. For the full design-arrival process, use
[`docs/DESIGN-HANDOFF.md`](docs/DESIGN-HANDOFF.md).

**Wording** is in `src/content/index.ts`. **Logo and images** are in `src/assets/config.ts`: put the file
in `public/images/` and set its `src`.

---

## 4. Changing the demo data

The fake database is in `src/mocks`. The first time someone opens the site, a copy of it is saved in
their browser (`localStorage`). From then on, every change they make, such as a booking, a new lead or
a price change, is saved there and survives a page reload. Each browser has its **own** copy, and there is
no sharing between people.

- **To start over in your browser:** open the browser's developer tools, go to *Application*, then
  *Local Storage*, and delete the `car-rental-mock-db-v…` entry. Or open the site in a private window.
- **After you edit anything in `src/mocks`**, open `src/mocks/store.ts` and add 1 to `SEED_VERSION`.
  Without this, browsers that already saved the old data keep showing it and your change looks like it
  did nothing.
- Pages that must be complete for search engines (the catalog, vehicle pages) are built on the server
  from the *original* data, then refreshed in the browser with the saved data.

---

## 5. Swapping the mocks for a real API

Screens never read the mock data directly. They call functions in `src/api` (for example
`listVehicles()`), and those functions read `src/mocks`. To go live, **rewrite the inside of the `src/api`
functions to call your server and keep the same names, inputs and results.** No screen should need to
change.

1. **Set up the base.** `src/api/client.ts` is where the server address, sign-in headers and error handling
   belong. Add a small `request()` helper there.
2. **Go file by file.** For each function in `src/api/*.ts`, replace the `readTable(...)` lines with a
   request, for example:

   ```ts
   // Before (mock)
   export async function listVehicles() {
     await simulateNetwork();
     return readTable("vehicles").filter((v) => v.status !== "inactive");
   }

   // After (real API)
   export async function listVehicles() {
     return request<Vehicle[]>("/vehicles");
   }
   ```

3. **Keep the shapes.** The data types in `src/types/index.ts` describe what the screens expect. Your API
   should return that shape (dates as ISO text, money as PHP numbers), or you convert it inside `src/api`.
4. **Report problems with `ApiError`.** Screens react to the *code* in an `ApiError` (for example
   `vehicle_unavailable`, `price_changed`, `duplicate_email`, `last_admin`). The full list is in
   `src/api/client.ts`. Have the server return matching codes and throw `new ApiError(message, status, code)`.
5. **Move the business rules to the server.** The rules in `src/lib` and `src/api` (availability by
   date, price snapshot, the booking status flow, "last active account" protection, sign-in checks) run in the
   browser today so the demo works. A real server **must repeat them**, because anything in a browser can
   be bypassed. `src/lib` can stay for showing the *same* answer to the visitor early (for example the
   price quote).
6. **Delete the mock files** once nothing imports them: `src/mocks`, `simulateNetwork`, and `readTable`.
7. **Server-side use.** Public pages call `src/api` on the Next.js server as well as in the browser. Give your
   `request()` helper a full server address (from an environment variable) so it works in both places.
8. Run `npm run test:e2e` against the real API, using a test database that resets. The tests expect the
   demo data, so seed it the same way.

### Sign-in

Today's login is a **fake**: one shared password, and a plain cookie that the site creates for itself
(`src/api/auth.ts`, `src/lib/session.ts`, `src/app/api/mock-session/route.ts`). It is fine for a demo and
**must not be used for real security.**

For the real thing:

- Replace `login`, `getSession` and `logout` in `src/api/auth.ts` so they call your server.
- Have the server set a real, signed, `httpOnly` cookie, and make `src/proxy.ts` check it properly.
- Delete `DEMO_PASSWORD` and `src/app/api/mock-session/route.ts`.
- **The server must check that someone is signed in on every request**, not just the screens (`assertAdmin` in
  `src/api/auth.ts` is where the mock does it). Every signed-in staff member is an admin. If you later need
  different levels of access, add them then.

---

## 6. Connecting a real payment gateway

All payment logic is in **one file: `src/api/payments.ts`**, in the function `processPayment`. Right now it
waits a moment and then returns "paid", or "declined" if the demo control asks for it. Replace its body
with your gateway (PayMongo, Xendit, Maya, GCash or similar), and keep the same input and result shape, so
the payment step and the booking do not change. `processPayment` is called from `createBooking` in
`src/api/bookings.ts`, which first checks that the vehicle is free and the price is unchanged, and only then
charges and saves the booking. A real server should keep that order (check, charge, save) in one step.

**Important:** the site must never see card numbers. Use the gateway's hosted page (the customer is sent
there and comes back) or the gateway's own secure embedded fields. Do not add card inputs to this
project, and never store card details. A backend is needed to create the payment session and to confirm
the result (a payment "webhook") before a booking is marked paid.

After the gateway is connected: set `NEXT_PUBLIC_SHOW_MOCK_CONTROLS=false` so the "force a decline"
control disappears, and remove the `mockOutcome` input.

---

## 7. Tests

`npm run test:e2e` opens the real site in a real browser and clicks through it: all six booking steps
(including a declined payment), the contact form, admin login and the admin sign-in, every admin
screen, keyboard-only use, and an **accessibility scan (axe)** of every main page. Details, and how to
run just one file, are in [`e2e/README.md`](e2e/README.md). The first time, run
`npm run test:e2e:install` to download the test browser.

---

## 8. Settings (environment variables)

Copy `.env.example` to `.env.local`.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | The real address of the site. Used in search engine links, the sitemap and sharing previews. **Set this before going live.** |
| `NEXT_PUBLIC_SHOW_MOCK_CONTROLS` | `true` | Shows the demo login accounts and the "force a declined payment" choice. Set to `false` for a clean demo or for production. |

---

## 9. Assumptions

Decisions made where the brief did not say. Each is easy to change; please check them with the client.

**The business**

- One company only, with no multiple branches or accounts. Prices are in **PHP**, formatted in one place
  (`src/lib/currency.ts`), which also shows the rough **USD** equivalent next to every price using a fixed
  placeholder exchange rate (`PHP_PER_USD` in that same file). All dates and times are **Manila time** (UTC+8,
  no daylight saving).
- **A rental day is a 24-hour block, rounded up.** Two days and one hour is three days. The minimum is one day.
- **Prices are a flat daily rate**, with no seasonal or weekend pricing. Staff can change a vehicle type's rate
  on the Pricing screen. **New bookings use the new rate; existing bookings keep the price they were made at.**
- There are no add-ons (no child seats, GPS and the like). A booking's price is just the vehicle's daily
  rate times the number of days.
- **Booking is open:** any vehicle can be booked for any dates. There is no double-booking check and no
  "unavailable for these dates" state. The only thing that stops a vehicle being booked is its own status
  (a vehicle marked "in maintenance" or "inactive" cannot be selected).
- **Vehicles are types, not particular cars.** The types are SUV, Multi-purpose vehicle (MPV, 7-8
  seaters), Sedan, Hatchback, Van, Pick-up truck, 125cc and 155cc. Each has an example shown as "Toyota
  Vios or similar", the most it seats, and a daily price. There are no plate numbers or model years. **Motorcycles (125cc/155cc) don't carry a seat count** — `seats` is optional on the
  `Vehicle` type, and every screen that shows seats just leaves that part out for them. There is no
  transmission, fuel type, year, description or feature list. The vehicle detail
  page shows the photos, those specs, and the price — no other text.
- Adding, editing or removing vehicles is **not** built (only the price). This was a deliberate scope
  decision. The 8 vehicle types come from `src/mocks/vehicles.ts`.
- **There is no preset list of pick-up/return locations.** The visitor always types or pastes where they
  mean — an address, or a Google Maps link — in a plain text field (`src/features/booking/components/dates-step.tsx`).
  Nothing checks that the text is a real place or a valid link; a real backend with an address-lookup
  service would be the place to validate it, and could also price a delivery/collection fee by how far the
  location is from a branch, something this skeleton does not attempt.

**Bookings and payment**

- Payment methods offered: card, GCash, Maya, PayPal, Wise and Pay at pick-up. All are **mock**. "Pay at
  pick-up" shows as pending until staff use "Mark payment received".
- The visitor checks the booking first and pays last. **Paying and confirming are one action:** the car and
  price are checked before anything is charged, and a failed payment books nothing.
- Booking statuses only move **forward**: pending, confirmed, active, completed. **Cancelling** is allowed
  only while pending or confirmed, and asks first.
- A confirmed booking **reuses the customer with the same email address**, or creates a new customer, and
  writes an entry in that customer's activity log.
- **Revenue in reports** counts confirmed, active and completed bookings, by the month of pick-up.
- The booking confirmation page is reachable by its reference. A real server should also check ownership
  (for example email plus reference), so strangers cannot read other people's bookings.

**CRM**

- There is **no separate "contact" record.** Customers and leads each have extra phone numbers and
  emails that can be added, edited and removed.
- A contact-form message creates a lead with the stage **New**. Leads move through New, Contacted,
  Qualified, Won and Lost. Converting a lead creates a customer.
- **There are no roles.** Every staff account is an admin. The system will not let the last active account be
  deactivated, and nobody can deactivate themselves.
- Staff sessions last 8 hours.

**Storage**

- Mock data is saved in each visitor's own browser, so it is not shared and can be cleared at any time.
  The mock login cookie is not secure (see [section 5](#5-swapping-the-mocks-for-a-real-api)).

---

## 10. What is left

**For the design phase:**

- Real colors, fonts, spacing, logo and photos, and final wording. See
  [`docs/DESIGN-HANDOFF.md`](docs/DESIGN-HANDOFF.md).
- A social-sharing image (`openGraph.images`), and a favicon and app icons in the final brand.
- Placeholder wording is everywhere in `src/content/index.ts` (about text, terms, phone,
  email, address). It needs the client's real details.
- Real terms and conditions and a privacy notice (the payment step links to none yet).

**For going live (needs a backend):**

- Replace `src/api` with real requests (section 5), real login and permissions on the server, and a real
  payment gateway (section 6).
- Emails (booking confirmations, contact-form receipts), and any notifications for staff.
- Setting up hosting and the real `NEXT_PUBLIC_SITE_URL`.
- **Pick-up/return locations are free text today** (an address or a Google Maps link), with nothing checking
  that they are real. A backend could validate them and, if useful, price a delivery/collection fee based
  on distance from a branch.

**Not built, on purpose or by scope:** adding and editing vehicles (only prices), invoices and receipts,
customer accounts and login for visitors, multiple languages (the wording is already in one file, so
this is possible), file uploads such as driver's license photos, and maps.

**Checked and not checked.** The accessibility scan and the keyboard tests pass. Automated scanning
finds many, but not all, accessibility problems. Before launch, also try the site with a screen reader
(such as NVDA, which is free), with the browser at 200% zoom, and on a real phone.
