# Design handoff

This site is a **grayscale wireframe skeleton**. Every page works, but nothing about how it looks is final.
This guide is for the day the designer's design arrives: it says which files to change, in what order,
and lists every page and component so nothing is missed.

The rule the whole project follows:

> **Look and function are separate.** All visual values live in one file (`tokens.css`). Everything that
> *looks* like something lives in the UI kit (`src/components/ui`). Pages only decide *layout*. Logic
> (data, forms, rules) never contains styling.

Because of that, re-skinning is mostly editing two places, and the pages barely change.

---

## 1. Which file do I edit for what?

| I want to change… | Edit this | Notes |
| --- | --- | --- |
| Colors (brand, text, backgrounds, status colors) | `src/styles/tokens.css` | Every color has a semantic name like `--primary` or `--bg-main`. Use the name, never a hex code, anywhere else. |
| Fonts | `src/assets/fonts.ts` and `--font-body` / `--font-heading` in `tokens.css` | Instructions are in the comment at the top of `fonts.ts`. |
| Font sizes, weights | `tokens.css` (`--text-*`, `--font-weight-*`) and heading styles in `src/styles/globals.css` | |
| Corner roundness | `tokens.css` (`--radius-*`) | |
| Shadows | `tokens.css` (`--shadow-*`) | Currently all `none` (flat wireframe). |
| Spacing, page width, tap-target height, sidebar width | `tokens.css` (`--spacing-*`, `--container-*`) | |
| Breakpoints (when the layout switches to desktop) | `tokens.css` (`--breakpoint-*`) | |
| Dark mode | `[data-theme="dark"]` block at the bottom of `tokens.css` | Live: a `ThemeToggle` button switches it, and the choice is remembered. Edit values here, same as the light ones above. |
| How a button, input, card, badge, table, dialog, etc. *looks* (borders, padding, states, icons) | The matching file in `src/components/ui/` | See the component list in section 4. |
| The logo | `src/assets/config.ts` (`logo`) plus the file in `public/images/` | Set `src` to e.g. `/images/logo.svg`. Until then a text wordmark shows. |
| Photos (hero, about, team, vehicles…) | `src/assets/config.ts` (`images`) plus files in `public/images/` | Each entry has `src`, `alt` (screen reader text), `label` (placeholder text), and `ratio`. Vehicle photos are per vehicle in `src/mocks/vehicles.ts`. |
| Any wording (headings, buttons, messages) | `src/content/index.ts` | Only the developer-only `/styleguide` page has its own text. |
| Page *layout* (what goes where, columns, order of sections) | The page file in `src/app/` and the section files in `src/components/sections/` and `src/components/layout/` | Layout classes only (`grid`, `flex`, `gap-*`, `lg:grid-cols-2`). |
| The website's title, description and social-sharing text | `src/content/index.ts` (`seo`, and each page's `meta`) | |
| A social-sharing image | Add `images` to `openGraph` in `src/lib/seo.ts` and `src/app/layout.tsx` | Not set yet because there are no real images. |
| Favicon | Replace `src/app/favicon.ico` | |

### What a designer should *not* have to touch

- `src/features/**` (the behavior of each screen), `src/api`, `src/mocks`, `src/lib`. These hold forms,
  data and rules. If a design needs a different *arrangement* inside a feature screen (for example the
  booking summary moving from a side panel to a bottom bar), the layout classes in that feature's
  component file change, but there should be no colors, sizes or fonts to touch there.

### The safety net: `npm run check:tokens`

This command fails if anyone types a hex color, a Tailwind default color (like `bg-blue-500`), an inline
`style`, or a fixed pixel/rem size outside `tokens.css` and the UI kit. Run it before every commit.
It keeps the promise that the design can be swapped in one place. (`npm run verify` runs it too.)

---

## 2. Checklist: bringing in the Figma design

Work in this order. Each step is small and can be checked on its own.

**A. Get ready**

- [ ] Ask the designer for the Figma link and a list of the design's colors, fonts, and sizes (the "styles" or "variables" panel). Ideally they name colors by purpose (primary, surface…), not by look (dark blue).
- [ ] Ask for exported logo files (SVG preferred) and the final photos, with their alt text.
- [ ] Ask what should happen at phone, tablet and desktop widths. The site is mobile-first, so phone designs are the starting point.
- [ ] Dark mode already exists and is switchable (see `ThemeToggle`). If it should be removed, delete the `[data-theme="dark"]` block in `tokens.css` and the `ThemeToggle` usages in `Navbar` and `AdminShell`.
- [ ] Run `npm run verify` and `npm run test:e2e` first so you know everything passes *before* you change anything.

**B. Tokens (`src/styles/tokens.css`)**

- [ ] Map each Figma color to a token. Keep the *names* (`--primary`, `--bg-surface`, `--card`…) and change the *values*, in both the light and the `[data-theme="dark"]` blocks. Add new tokens only if the design has a color with no equivalent.
- [ ] Set fonts (`src/assets/fonts.ts` and `tokens.css`) and the type scale.
- [ ] Set radius, shadows, spacing and container widths.
- [ ] Every text/background pair must meet contrast: **4.5 : 1** for normal text, **3 : 1** for large text and for the borders of form fields and icons. If a pair from the design fails, tell the designer now. It is cheaper to fix in Figma. The accessibility tests (step G) also catch this.

**C. Logo and images**

- [ ] Put files in `public/images/`.
- [ ] Update `logo` and `images` in `src/assets/config.ts`, and vehicle images in `src/mocks/vehicles.ts`. Write real `alt` text. Use an empty `alt` only for purely decorative images.
- [ ] Bump `SEED_VERSION` in `src/mocks/store.ts` after editing anything in `src/mocks` (see the README, "Changing the demo data").

**D. UI kit (`src/components/ui`)**

Go component by component against Figma, starting with the most used: Button, Input/Select/Textarea/Checkbox/Radio, FormField, Card, Badge, Table, Modal, Navbar, Footer, AdminShell. For each:

- [ ] Compare sizes, padding, border, radius and colors in every state: normal, hover, focus, disabled, error, loading.
- [ ] Keep the visible **focus outline** (see `globals.css`). Do not remove it. It is what keyboard users see.
- [ ] Keep each control at least **44 px** tall on phones (`--spacing-control`).
- [ ] Look at the result on the **`/styleguide`** page, which shows every component in one place. It is the fastest way to review the whole kit against the design.

**E. Layout, page by page**

- [ ] Public pages: Home, Vehicles, Vehicle detail, About, Contact, then the six booking steps. Edit `src/app/(public)/**` and `src/components/sections/**`.
- [ ] Admin: the design may cover only the public site. If the admin has no design, restyling the UI kit already restyles the admin.
- [ ] Add any section the design has that the skeleton lacks (a page file plus a `Section`), with its text in `src/content`.
- [ ] Remove sections the design does not have (for example the customer reviews section on the home page).

**F. Copy**

- [ ] Replace placeholder text in `src/content/index.ts`: site name, tagline, description, phone, email, address, hours, about text, terms of service.
- [ ] Check the tone matches for errors and empty states, not just headings. Those are in the same file.

**G. Prove nothing broke**

- [ ] `npm run verify` (types, lint, token check, build).
- [ ] `npm run test:e2e`. This runs about 90 automated checks, including the color-contrast and accessibility scan of every page. Failures caused only by *renamed wording* are fixed by updating `src/content` (tests read their text from there). See `e2e/README.md`.
- [ ] Test by hand on a real phone, with the keyboard only (Tab, Enter, Space, Escape, arrows), and with browser zoom at 200%.
- [ ] Turn on the operating system's "reduce motion" setting and confirm any new animation stops (`globals.css` already forces this).

---

## 3. Every page

### Public site

| Page | Route | File | What it does |
| --- | --- | --- | --- |
| Home | `/` | `src/app/(public)/page.tsx` | Hero, quick search (location + dates), featured vehicles, how it works, customer reviews (only the ones staff switched on), call to action |
| Vehicles | `/vehicles` | `src/app/(public)/vehicles/page.tsx` | Catalog with filters (category, price, seats), sorting, pagination, and a trip summary when dates are given |
| Vehicle detail | `/vehicles/[slug]` | `src/app/(public)/vehicles/[slug]/page.tsx` | Gallery, type, seats, price and Book now — deliberately no other text |
| Special offers | `/special-offers` | `src/app/(public)/special-offers/page.tsx` | Static marketing copy: weekly/monthly rates, with-driver, tours, point-to-point |
| About | `/about` | `src/app/(public)/about/page.tsx` | Company story and team |
| Contact | `/contact` | `src/app/(public)/contact/page.tsx` | Contact details and message form (creates a New lead) |
| Leave a review | `/review` | `src/app/(public)/review/page.tsx` | Name, star rating, comment and booking reference. Saved privately (linked from the footer) |
| Log in | `/login` | `src/app/(public)/login/page.tsx` | Customer login: Google, Apple, email and password, or an email code (mock) |
| Sign up | `/signup` | `src/app/(public)/signup/page.tsx` | Create a customer account. Saved details can fill in the booking's details step |
| Booking, step 1 to 6 | `/book/dates`, `/book/vehicle`, `/book/details`, `/book/check`, `/book/payment`, `/book/confirmation/[reference]` | `src/app/(public)/book/**` | Dates and place, vehicle, driver details, check, payment (pays and confirms the booking), confirmation |
| Not found and error | any unknown address, and unexpected errors | `src/app/not-found.tsx`, `src/app/error.tsx` | Friendly messages |
| UI kit (developers only) | `/styleguide` | `src/app/(public)/styleguide/page.tsx` | Every reusable component in one place. Hidden from search engines. |

### Admin area (`/admin`, signed-in staff only)

Each page needs a permission (set on the Roles screen). The sidebar only shows what the signed-in role can open.

| Page | Route | Permission | What it does |
| --- | --- | --- | --- |
| Login | `/admin/login` | none | Sign in (demo accounts are listed in the demo) |
| No access | `/admin/forbidden` | signed in | Shown when a role opens a page it lacks |
| Dashboard | `/admin` | `dashboard.view` | Key numbers (leads, bookings, open tasks), leads by stage, recent activity. Cards a role cannot use are left out. |
| Customers | `/admin/customers`, `/admin/customers/[id]` | `customers.view` (`customers.edit` to change) | List with search, profile with extra phones and emails, bookings, notes and tasks |
| Leads | `/admin/leads`, `/admin/leads/[id]` | `leads.view` (`leads.edit` to change) | List with filters, detail with activity log, convert to customer |
| Pipeline | `/admin/pipeline` | `leads.view` | Board of lead stages, drag or use "Move to" |
| Tasks | `/admin/tasks` | `tasks.manage` | To-dos linked to a lead or customer, overdue flags |
| Bookings | `/admin/bookings`, `/admin/bookings/[id]` | `bookings.view` (`bookings.edit` to change) | List with filters, detail with status changes and payment |
| Reports | `/admin/reports` | `reports.view` | Charts and tables by date range |
| Pricing | `/admin/pricing` | `pricing.edit` | Change a vehicle's daily rate |
| Reviews | `/admin/reviews` | `reviews.manage` | Read every customer review and switch each one on or off for the website |
| Users | `/admin/users` | `users.manage` | Staff accounts: add, edit, deactivate |
| Roles | `/admin/roles` | `roles.manage` | Roles and their permission checkboxes |

Other files that are not pages but affect what visitors get: `src/app/sitemap.ts`, `src/app/robots.ts`,
`src/proxy.ts` (guards `/admin`), `src/app/api/mock-session/route.ts` (the fake login cookie, mock only).

---

## 4. Every reusable component

### The UI kit: `src/components/ui/` (the only place where things get their look)

| Group | Components |
| --- | --- |
| Actions | `Button` (variants: primary, secondary, outline, ghost, danger, link; sizes; loading), `DropdownMenu` |
| Form controls | `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `DatePicker`, `TimeSelect`, `FormField` and `FieldGroup` (label, hint, error, and the correct screen-reader wiring) |
| Containers | `Card` (with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`), `Modal`, `ConfirmModal`, `Tabs`, `Table` (scrolls sideways on phones), `Container`, `Section`, `PageHeader` |
| Feedback | `Alert`, `Badge`, `Toast`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState` |
| Navigation | `Navbar`, `Footer`, `AdminShell` (sidebar plus top bar), `Pagination`, `Stepper` (booking progress), `SkipLink`, `ThemeToggle` |
| Display | `Media` (image or placeholder), `Logo`, `SocialLinks`, `StatCard`, `BarChart` |
| Icons | `icons.tsx` (a single file of small SVG icons) |
| Shared style helpers | `control-styles.ts` (the look shared by all form controls) |

### Layout and section components: `src/components/layout`, `src/components/sections`

`SiteHeader`, `SiteFooter`, `AdminFrame` (connects the admin shell to the signed-in user, the menu and log out), and the home page sections
`HowItWorks`, `CtaBanner`.

### Feature components: `src/features/*/components` (behavior plus layout, no visual values)

| Area | Components |
| --- | --- |
| Vehicles | `VehicleCatalog`, `VehicleFilters`, `VehicleGrid`, `VehicleCard`, `VehicleDetail`, `VehicleGallery`, `FeaturedVehicles`, `TripSummary` |
| Search | `QuickSearch` |
| Booking | `BookingShell`, `DatesStep`, `VehicleStep`, `VehicleOption`, `DetailsStep`, `PaymentStep`, `CheckStep`, `Confirmation`, `BookingSummary`, plus small parts in `step-parts.tsx` |
| Contact | `ContactForm` |
| Auth | `LoginForm`, `ForbiddenNotice`, `Can` (hides a control from roles that lack the permission) |
| Dashboard | `DashboardView` |
| Customers | `CustomerList`, `CustomerProfile`, `CustomerFormModal`, `ContactDetailsCard` (extra phones and emails) |
| Leads | `LeadList`, `LeadDetail`, `LeadFormModal` |
| Activities | `ActivityLog`, `ActivityItem` |
| Pipeline | `PipelineBoard` |
| Tasks | `TaskList`, `TaskFormModal`, `LinkedTasksCard`, `TaskDue` |
| Bookings | `BookingList`, `BookingDetail`, `BookingStatusBadge` |
| Reports | `ReportsView` |
| Pricing | `PricingTable` |
| Users and roles | `UserTable`, `UserFormModal`, `RoleTable`, `RoleFormModal`, `PermissionMatrix` |
| Shared | `SearchBox` (waits for you to stop typing), `use-url-params` (keeps filters in the address bar) |

Status colors for lead stages and booking statuses come from `src/features/leads/stage-style.tsx` and
`src/features/bookings/status-style.ts`. They map each status to a Badge variant, so a new palette
restyles them automatically.

---

## 5. Things a designer should know about how this site behaves

- **Prices are a flat daily rate**, in Philippine pesos, formatted in one place (`src/lib/currency.ts`).
- **A 24-hour block is one day.** A rental of 2 days and 1 hour is charged as 3 days. The wording shown to the visitor is in `src/content`.
- **Payment step:** the site never asks for card numbers. With a real payment company, card details are typed into the company's own secure fields or page. The design should leave room for that (an embedded box or a redirect). Card / GCash / Maya / PayPal / Wise / Pay at pick-up are radio options.
- **Prices show PHP with a rough USD amount alongside**, e.g. "₱1,800.00 (~$31)". Both come from one function (`formatCurrency` in `src/lib/currency.ts`), so the design should give this string room rather than assuming a short PHP-only amount.
- **Booking is open** (no "sold out" dates), and a vehicle is just its type, seat count and price — no transmission, fuel, year or description. Design accordingly: there is no long specs list or body copy to lay out on the vehicle detail page, only the gallery, a short specs table and the price card.
- **There is no location dropdown.** Pick-up and return are a single text field each ("paste a Google Maps link, or type an address"), not a list to style as a `<select>`.
- **Empty, loading and error states exist for every list.** The design should include them too.
- **Long text:** names, emails and vehicle names can be long. Give text room to wrap. Tables scroll sideways on phones.
- **Status is never color alone.** Every badge also has its word. Keep it that way for color-blind users.
- **Motion:** there is none in the skeleton. Anything the design adds is automatically switched off for people who choose "reduce motion".
