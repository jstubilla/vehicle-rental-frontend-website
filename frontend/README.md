# Car Rental Co. — website

A car rental website for **one company**, with a booking flow for visitors and a built-in admin area
(a small CRM) for staff.

- **Data lives in Supabase** (the database, sign-in and photo storage), set up in [`../backend`](../backend).
  The screens reach it only through `src/api` (see [section 5](#5-how-the-data-flows)).
- **Grayscale wireframe.** The look is a placeholder until the designer's design arrives. The look and
  the function are kept separate, so the design can be applied without breaking anything. See
  [`docs/DESIGN-HANDOFF.md`](docs/DESIGN-HANDOFF.md).

Built with Next.js (App Router), TypeScript, Tailwind CSS, Radix UI, React Hook Form and Zod, and
TanStack Query. Currency is Philippine pesos (PHP) and times are Manila time.

---

## 1. Run it

You need [Node.js](https://nodejs.org) 20 or newer, and a Supabase database with the migrations from
[`../backend`](../backend) applied: your hosted staging project, or a local one (`npx supabase start` in
`backend/`, which needs Docker and loads the demo data). Run every command below from this `frontend/` folder.

```bash
cd frontend
npm install
cp .env.example .env.local   # then fill in the Supabase settings (section 8)
npm run dev
```

Open <http://localhost:3000>.

> **Windows PowerShell says "running scripts is disabled"?** Use `npm.cmd` instead of `npm`
> (for example `npm.cmd run dev`), or run the commands in Command Prompt.

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
| `/privacy`, `/terms` | Placeholder Privacy Policy and Rental Terms (linked from the footer, the payment step and the forms). **Replace them before going live.** |
| `/login`, `/signup` | Customer accounts. A signed-in customer is asked whether to fill in their saved details when booking |
| `/admin` | Admin area (sign in first) |
| `/styleguide` | Every reusable component in one page (for developers) |

### Signing in to the admin

Every staff account is an **admin** and can do everything: there are no roles or permissions. A staff
member is a Supabase sign-in account with an active row in the `staff` table; create the first one as
described in [`../backend/README.md`](../backend/README.md), then add colleagues on the Users screen (they get
an invitation email and choose their password at `/admin/set-password`).

With the **local** database, the demo data includes staff accounts (for example `admin@carrental.example`)
and a customer (`maria.santos@example.com`), all with the password **`demo1234`**.

The payment "demo controls" only show while `NEXT_PUBLIC_SHOW_MOCK_CONTROLS` is not `false`.

---

## 2. What is in it

**Public site:** home page with quick search, vehicle catalog and detail pages, a Tours & Transfers page (at /special-offers),
about page, contact form, and a six-step booking flow (dates and place, vehicle, driver details, check,
payment, confirmation) with a **mock payment** that can succeed or be declined. The last step pays and
confirms the booking in one action. Booking is open — every vehicle can be booked for any dates.

**Admin area:** dashboard, customers, leads, a drag-and-drop pipeline, tasks, bookings, reports,
vehicle pricing, customer reviews and staff users. The complete list of
pages and components is in [`docs/DESIGN-HANDOFF.md`](docs/DESIGN-HANDOFF.md).

**How it stays organized.** Three layers, and a file only belongs in one of them:

| Layer | Where | What it may contain |
| --- | --- | --- |
| **Logic** | `src/features/*/hooks`, `src/api`, `src/lib` | Data, forms, rules. **No styling at all.** |
| **UI kit** | `src/components/ui` | The only place where things get their look. Every value comes from `src/styles/tokens.css`. |
| **Pages** | `src/app`, `src/features/*/components` | Layout only: what goes where. |

Other folders worth knowing:

| Folder | Purpose |
| --- | --- |
| `src/content/index.ts` | **All wording.** Nothing else contains text that visitors read. |
| `src/assets/config.ts` | The logo and every image |
| `src/components/ui/loading-screen.tsx` | The placeholder loading screen, shown on every refresh of the public site (minimum time: `SPLASH_MIN_MS` in `src/lib/site.ts`). Put the company loading animation in its `LoadingAnimation` function (see `docs/DESIGN-HANDOFF.md`) |
| `src/api` | The only door to the data (Supabase). Every function is `async`. |
| `src/app/api` | The two things only the server may do: record a payment, and invite or edit staff accounts |
| `src/proxy.ts` | Guards `/admin` (Next.js 16 calls this file a "proxy"; older versions call it "middleware") |
| `e2e` | The automated browser tests, and in `e2e/fixtures` the demo data they expect |
| `scripts/generate-seed.mjs` | Turns `e2e/fixtures` into the local demo database (`../backend/supabase/seed.sql`) |
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

The **local** database (`npx supabase start` in `backend/`) is filled with demo data: 8 vehicle types,
20 customers, 15 bookings, 15 leads and more, plus demo sign-in accounts. It comes from
`../backend/supabase/seed.sql`, which is generated from the test fixtures in `e2e/fixtures`:

1. Edit the files in `e2e/fixtures`.
2. Run `node scripts/generate-seed.mjs` (here, in `frontend/`).
3. Run `npx supabase db reset` in `backend/` to rebuild the local database with it.

Dates in the demo data are relative to the day it is loaded, so it always looks current. The demo data is
never loaded into a hosted project.

---

## 5. How the data flows

Screens never talk to the database directly. They call functions in `src/api` (for example
`listVehicles()`), which use Supabase (`src/api/supabase.ts`) and convert the rows into the types in
`src/types/index.ts` (`src/api/rows.ts`).

- **Who may do what is decided by the database**, not the screens: its row-level security lets visitors
  read the catalog only, signed-in customers see their own bookings, and active staff do everything. The
  business rules (prices, the booking status flow, the "last active account" protection) are enforced there
  too; see [`../backend/README.md`](../backend/README.md).
- **Visitors' actions** (booking requests, the contact form, reviews, paying, cancelling) call database
  functions that check everything themselves. The price is always worked out by the database from the
  current rates.
- **Booking photos** are uploaded from the browser to a private Storage bucket that only staff can read.
  Staff see them through links that expire after 10 minutes.
- **Two things run on the Next.js server** with the secret service-role key, in `src/app/api`: recording a
  payment (`payments`) and inviting or editing staff accounts (`staff`). Nothing else needs that key.
- **Errors**: a broken rule comes back as an `ApiError` whose `code` the screens understand (for example
  `price_changed`, `duplicate_email`, `last_admin`); the list is in `src/api/client.ts`.
- **Public pages** (home, catalog, vehicle pages) also load data on the server with the public key, and
  refresh in the browser. The home page and the vehicle pages are pre-built when the site is deployed, so
  the HTML search engines read shows the prices of that moment; visitors' browsers always load the
  current ones. **The build needs the Supabase settings**, because it reads the vehicles.

### Sign-in

Staff and website customers both sign in with **Supabase Auth**; the session is kept in cookies.

- `src/api/auth.ts`: staff login. Only an active row in `staff` lets someone into `/admin`; `src/proxy.ts`
  checks this before every admin page, and the database checks it again on every request.
- `src/api/account.ts`: customer sign-up, password login, a 6-digit email code, and Google / Apple.
- `src/app/auth/callback`: where Google, Apple and Supabase's emails send people back to.

One browser has one session: signing in as a customer on the public site signs a staff member out of the
admin area, and the other way round.

---

## 6. Connecting a real payment gateway

All payment logic is in **one file: `src/api/payments.ts`**, in the function `processPayment`. Right now it
waits a moment and then returns "paid", or "declined" if the demo control asks for it. Replace its body
with your gateway (PayMongo, Xendit, Maya, GCash or similar), and keep the same input and result shape, so
the payment step and the booking do not change. `processPayment` runs on the server, in
`src/app/api/payments/route.ts`, which first checks that the booking is approved and not overdue, then
charges, then records the payment with the database function `record_booking_payment`.

**Until a real gateway is connected, anyone who has a booking's reference and email can "pay" for it with
the mock and confirm it for free.** Do not take real bookings before this is replaced.

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
screen, keyboard-only use, and an **accessibility scan (axe)** of every main page. They run against the
**local** Supabase database and put the demo data back before every test, so never point them at a real
project. Details, and how to run just one file, are in [`e2e/README.md`](e2e/README.md). The first time,
run `npm run test:e2e:install` to download the test browser.

---

## 8. Settings (environment variables)

Copy `.env.example` to `.env.local`.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | The real address of the site. Used in search engine links, the sitemap and sharing previews. **Set this before going live.** |
| `NEXT_PUBLIC_SUPABASE_URL` | (none, required) | The Supabase project's URL (Project Settings → API). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (none, required) | The project's public **anon** (publishable) key. Safe in the browser: the database's security rules decide what it can do. |
| `SUPABASE_SERVICE_ROLE_KEY` | (none, required on the server) | The **secret** service-role key, used only by `src/app/api` (payments, staff invitations). Never prefix it with `NEXT_PUBLIC_`, never commit it. |
| `NEXT_PUBLIC_SHOW_MOCK_CONTROLS` | `true` | Shows the "force a declined payment" choice on the pay page. Set to `false` for production. |

On Vercel, add the same variables under Project Settings → Environment Variables (the service-role key
for the server only). In the Supabase project, set **Authentication → URL Configuration**: the Site URL to
the website's address, and add `https://<your site>/auth/callback` (and `http://localhost:3000/**` for
development) to the Redirect URLs.

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
- The one add-on is **"With a driver"** (cars and vans only; motorcycles are always "Vehicle only"): a licensed driver
  comes with the vehicle at a flat daily rate (`DRIVER_DAILY_RATE` in `src/lib/pricing.ts`, the only place it is set),
  charged for every rental day, so the total is (vehicle daily rate + driver rate) × days. The booking keeps the
  driver rate it was made at, like the vehicle rate. There are no other add-ons (no child seats, GPS and the like).
  Without a driver, a booking's price is just the vehicle's daily rate times the number of days.
- **Booking is open:** any vehicle can be booked for any dates. There is no double-booking check and no
  "unavailable for these dates" state. The only thing that stops a vehicle being booked is its own status
  (a vehicle marked "in maintenance" or "inactive" cannot be selected).
- **Vehicles are types, not particular cars.** The types are SUV, Multi-purpose vehicle (MPV, 7-8
  seaters), Sedan, Hatchback, Van, Pick-up truck, 125cc and below, and 150cc–160cc motorcycles. Each has an example shown as "Toyota
  Vios or similar", the most it seats, and a daily price. There are no plate numbers or model years. **Motorcycles (125cc and below, 150cc–160cc) don't carry a seat count** — `seats` is optional on the
  `Vehicle` type, and every screen that shows seats just leaves that part out for them. There is no
  transmission, fuel type, year, description or feature list. The vehicle detail
  page shows the photos, those specs, and the price — no other text.
- Adding, editing or removing vehicles is **not** built (only the price). This was a deliberate scope
  decision. The 8 vehicle types are added by the database migration `…_catalog_data.sql` in `../backend`.
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
- How long staff stay signed in is a Supabase Auth setting (Authentication → Sessions).

---

## 10. What is left

**For the design phase:**

- Real colors, fonts, spacing, logo and photos, and final wording. See
  [`docs/DESIGN-HANDOFF.md`](docs/DESIGN-HANDOFF.md).
- A social-sharing image (`openGraph.images`), and a favicon and app icons in the final brand.
- Placeholder wording is everywhere in `src/content/index.ts` (about text, terms, phone,
  email, address). It needs the client's real details.
- Real terms and conditions and a privacy notice (placeholder pages exist and are already linked from the footer, the payment step and the forms).

**For going live:**

- Replace the placeholder Privacy Policy and Rental Terms with versions approved by the client.
- A real payment gateway (section 6). Until then, payments are not real.
- Emails (booking confirmations, contact-form receipts), and any notifications for staff. The places are
  marked `EMAIL TRIGGER GOES HERE`; Supabase Auth already sends its own sign-in emails.
- Setting up hosting and the real `NEXT_PUBLIC_SITE_URL`.
- **Pick-up/return locations are free text today** (an address or a Google Maps link), with nothing checking
  that they are real. A backend could validate them and, if useful, price a delivery/collection fee based
  on distance from a branch.

**Not built, on purpose or by scope:** adding and editing vehicles (only prices), invoices and receipts,
multiple languages (the wording is already in one file, so this is possible), and maps.

**Checked and not checked.** The accessibility scan and the keyboard tests pass. Automated scanning
finds many, but not all, accessibility problems. Before launch, also try the site with a screen reader
(such as NVDA, which is free), with the browser at 200% zoom, and on a real phone.
