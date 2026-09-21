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
| `/admin` | Admin area (sign in first) |
| `/styleguide` | Every reusable component in one page (for developers) |

### Signing in to the admin

The login page lists four demo accounts, one for each starting role. They all use the password
**`demo1234`**. **Admin** can do everything. **Sales**, **Accountant** and **Operations** each see only
the pages their role allows, so signing in as each one is a good way to see roles at work.

The demo accounts and the payment "demo controls" only show while `NEXT_PUBLIC_SHOW_MOCK_CONTROLS` is not
`false`.

---

## 2. What is in it

**Public site:** home page with quick search, vehicle catalog and detail pages, about page, contact
form, and a six-step booking flow (dates and place, vehicle and extras, driver details, payment, review,
confirmation) with a **mock payment** that can succeed or be declined.

**Admin area:** dashboard, customers, leads, a drag-and-drop pipeline, tasks, bookings, reports,
vehicle pricing, staff users, and roles with an editable permission checklist. The complete list of
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
| `src/mocks` | The fake data (12 vehicles, 5 locations, 20 customers, 15 bookings, 15 leads, and more) |
| `src/api` | The only door to the data. Every function is `async`, like a real API. |
| `src/proxy.ts` | Guards `/admin` (Next.js 16 calls this file a "proxy"; older versions call it "middleware") |
| `e2e` | The automated browser tests |
| `docs` | The design handoff guide |

---

## 3. Changing the look (theme)

Open **`src/styles/tokens.css`**. Every color, font, size, corner radius, shadow and spacing value in the
whole site is defined there once, with a comment. Change a value and the whole site follows:

```css
--color-primary: #1a1a1a;   /* try a blue like #1d4ed8 and every main button changes */
```

There is also a dark theme at the bottom of the file. Add `data-theme="dark"` to the `<html>` tag in
`src/app/layout.tsx` to try it.

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
   date, price snapshot, the booking status flow, "last admin" protection, permission checks) run in the
   browser today so the demo works. A real server **must repeat them**, because anything in a browser can
   be bypassed. `src/lib` can stay for showing the *same* answer to the visitor early (for example the
   price quote).
6. **Delete the mock files** once nothing imports them: `src/mocks`, `simulateNetwork`, and `readTable`.
7. **Server-side use.** Public pages call `src/api` on the Next.js server as well as in the browser. Give your
   `request()` helper a full server address (from an environment variable) so it works in both places.
8. Run `npm run test:e2e` against the real API, using a test database that resets. The tests expect the
   demo data, so seed it the same way.

### Sign-in and permissions

Today's login is a **fake**: one shared password, and a plain cookie that the site creates for itself
(`src/api/auth.ts`, `src/lib/session.ts`, `src/app/api/mock-session/route.ts`). It is fine for a demo and
**must not be used for real security.**

For the real thing:

- Replace `login`, `getSession` and `logout` in `src/api/auth.ts` so they call your server.
- Have the server set a real, signed, `httpOnly` cookie, and make `src/proxy.ts` check it properly.
- Delete `DEMO_PASSWORD` and `src/app/api/mock-session/route.ts`.
- **The server must check permissions on every request**, not just the screens. Hiding a button is a
  convenience, not protection. The permission ids are in `src/lib/constants.ts` and the page mapping in
  `src/lib/permissions.ts`. Sidebar, route guard and API all check the *permission*, never the role name,
  so roles can be edited freely.
- A role's permissions are copied into the session at sign-in, so a role change applies at the person's
  *next* sign-in. A real server can decide to apply it sooner.

---

## 6. Connecting a real payment gateway

All payment logic is in **one file: `src/api/payments.ts`**, in the function `processPayment`. Right now it
waits a moment and then returns "paid", or "declined" if the demo control asks for it. Replace its body
with your gateway (PayMongo, Xendit, Maya, GCash or similar), and keep the same input and result shape, so
the payment step and the booking do not change.

**Important:** the site must never see card numbers. Use the gateway's hosted page (the customer is sent
there and comes back) or the gateway's own secure embedded fields. Do not add card inputs to this
project, and never store card details. A backend is needed to create the payment session and to confirm
the result (a payment "webhook") before a booking is marked paid.

After the gateway is connected: set `NEXT_PUBLIC_SHOW_MOCK_CONTROLS=false` so the "force a decline"
control disappears, and remove the `mockOutcome` input.

---

## 7. Tests

`npm run test:e2e` opens the real site in a real browser and clicks through it: all six booking steps
(including a declined payment), the contact form, admin login and what each role can open, every admin
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
  (`src/lib/currency.ts`). All dates and times are **Manila time** (UTC+8, no daylight saving).
- **A rental day is a 24-hour block, rounded up.** Two days and one hour is three days. The minimum is one day.
- **Prices are a flat daily rate**, with no seasonal or weekend pricing. Staff with the pricing permission
  can change a vehicle's rate. **New bookings use the new rate; existing bookings keep the price they were made at.**
- Extras (for example GPS) are priced per day or as a one-time fee, and added to the total.
- A vehicle is "taken" for the dates of any booking that is **pending, confirmed or active.** Cancelled and
  completed bookings free it. Availability is checked by date overlap, and again when the booking is confirmed.
- Adding, editing or removing vehicles is **not** built (only the price). This was a deliberate scope
  decision. The 12 vehicles come from `src/mocks/vehicles.ts`.

**Bookings and payment**

- Payment methods offered: card, GCash, Maya and Pay at pick-up. All are **mock**. "Pay at pick-up" shows as
  pending until staff use "Mark payment received".
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
- **Roles:** four starting roles (Admin, Sales, Accountant, Operations) with an editable permission
  checklist. Choosing an "edit" permission also selects the matching "view" permission. The **Admin role is
  built in**: it cannot be edited or deleted, and the system will not let the last active administrator be
  deactivated or moved to another role.
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
- Placeholder wording is everywhere in `src/content/index.ts` (about text, testimonials, terms, phone,
  email, address). It needs the client's real details.
- Real terms and conditions and a privacy notice (the review step links to none yet).

**For going live (needs a backend):**

- Replace `src/api` with real requests (section 5), real login and permissions on the server, and a real
  payment gateway (section 6).
- Emails (booking confirmations, contact-form receipts), and any notifications for staff.
- Setting up hosting and the real `NEXT_PUBLIC_SITE_URL`.

**Not built, on purpose or by scope:** adding and editing vehicles (only prices), invoices and receipts,
customer accounts and login for visitors, multiple languages (the wording is already in one file, so
this is possible), file uploads such as driver's license photos, and maps.

**Checked and not checked.** The accessibility scan and the keyboard tests pass. Automated scanning
finds many, but not all, accessibility problems. Before launch, also try the site with a screen reader
(such as NVDA, which is free), with the browser at 200% zoom, and on a real phone.
