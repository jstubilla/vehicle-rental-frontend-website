# Backend (Supabase)

This folder is the Supabase project for the car rental site. It holds everything that lives in the
database: tables, row-level security policies, database functions, seed data and edge functions.
It does not depend on anything in `frontend/`.

```
backend/
├── supabase/
│   ├── config.toml     # Supabase settings (used by the CLI and the local stack)
│   ├── migrations/     # SQL migrations, applied in filename order
│   ├── templates/      # Auth emails: the 6-digit login code and the staff invitation
│   ├── seed.sql        # Demo data for the LOCAL database only (generated, see below)
│   └── functions/      # Edge functions (server code, e.g. payment webhooks) — none yet
└── tests/              # Runs the migrations on plain Postgres and checks the business rules
```

## The database

The website (`frontend/src/api`) reads and writes these tables and calls these functions.

| Migration | What it does |
| --- | --- |
| `…_initial_schema.sql` | Enums and tables: `settings`, `vehicles`, `staff`, `profiles`, `customers`, `leads`, `contact_details`, `activities`, `tasks`, `bookings`, `booking_documents`, `payments`, `reviews` |
| `…_business_rules.sql` | Rules the database enforces whoever writes: booking status flow, locked booking price, booking references, at least one active staff account, no deleting customers with bookings, lower-case emails, a profile for every new user, and a job (pg_cron, every 15 min) that cancels approved bookings not paid within the deadline |
| `…_row_level_security.sql` | Who sees what: visitors read the catalog and settings only; signed-in customers read their own profile, bookings and payments; active staff read and change everything |
| `…_public_functions.sql` | Functions the website calls with `supabase.rpc(...)` (below) |
| `…_storage.sql` | The private `booking-documents` bucket for ID photos: visitors can only upload, staff can read |
| `…_catalog_data.sql` | The 8 vehicle types and the rates (driver ₱1,000/day, 10% down payment, 24 hours to pay) |
| `…_account_access.sql` | A deactivated staff member can read their own row (so the login can say so), and a customer can read their own customer record (for My bookings) |

**Conventions.** Columns are `snake_case` (the front end's `src/api` maps them to its camelCase types).
Enum values match `frontend/src/lib/constants.ts` exactly. Money is whole pesos. When a rule is broken,
the error *message* is one of the front end's `ApiErrorCode` values (`price_changed`, `not_found`,
`invalid_transition`, …) and the *detail* explains it; `invalid_input` is new and covers missing or bad form
values.

**Functions for the website** (callable with the public anon key):

| Function | Replaces (frontend/src/api) |
| --- | --- |
| `create_booking_request(...)` | `createBooking`: prices the booking from the current rates, checks `expected_total`, reuses the customer by email, attaches the uploaded photos |
| `get_booking_by_reference(reference)` | `getBookingByReference` (shows only the customer's name) |
| `get_own_booking(reference, email)` | `getOwnBooking` |
| `cancel_own_booking(reference, email, reason)` | `cancelOwnBooking` |
| `resubmit_documents(reference, email, documents)` | `resubmitDocuments` |
| `submit_inquiry(...)` | `submitInquiry` (contact form → new lead) |
| `submit_review(...)`, `list_published_reviews()` | `submitReview`, `listPublishedReviews` |

`record_booking_payment(...)` replaces the saving part of `payForBooking`. Only the service-role key may call
it: the payment server calls it after the gateway confirms the charge.

Staff screens read and write the tables directly; the rules above apply to them too. Approving documents
is `update bookings set documents_status = 'verified'` (the booking becomes `approved` by itself);
rejecting them needs a `rejection_reason`.

## Accounts

Everyone signs in with Supabase Auth. A **staff member** is an auth user with an active row in `staff`;
anyone else is a website customer with a row in `profiles`.

**First admin.** Create the user under Authentication → Users in the dashboard, then run in the SQL editor:

```sql
insert into public.staff (id, name, email)
select id, 'Your Name', email from auth.users where email = 'you@example.com';
```

After that, staff add colleagues on the website's Users screen: it emails them an invitation, and the
link lets them choose a password at `/admin/set-password`.

A customer sees their bookings once their email is **confirmed**: keep "Confirm email" switched on under
Authentication → Providers → Email on the hosted project.

### Settings for a hosted project

The local stack takes these from `config.toml`; on a hosted project set them in the dashboard:

1. **Authentication → URL Configuration**: Site URL = the website's address. Redirect URLs: add
   `https://<your site>/auth/callback**` (and `http://localhost:3000/**` for development).
2. **Authentication → Email Templates**:
   - *Magic Link*: the website asks for a **6-digit code**, so the email must show it. Use the text of
     `supabase/templates/magic-link.html` (it contains `{{ .Token }}`).
   - *Invite user*: use `supabase/templates/invite.html`, whose link goes through the website's
     `/auth/callback` so the new staff member is signed in and can choose their password.
3. **Authentication → Providers**: turn on Google and/or Apple if you want those buttons to work (each
   needs that provider's own client id and secret). Leave Email on with "Confirm email" on.
4. Supabase's built-in email sender is only for testing (a few emails per hour). Before going live, set
   up your own SMTP under **Authentication → Emails → SMTP Settings**.

## Working on it

You need the [Supabase CLI](https://supabase.com/docs/guides/cli). Run every command from this
`backend/` folder. `npx supabase` works without installing it.

| Command | What it does |
| --- | --- |
| `npx supabase migration new <name>` | Create a new, empty migration file in `supabase/migrations/` |
| `npx supabase start` | Run a local Supabase stack (needs Docker) |
| `npx supabase db reset` | Rebuild the local database from the migrations and `seed.sql` (the demo data) |
| `npx supabase status -o env` | Show the local stack's URL and keys (for `frontend/.env.local`) |
| `npx supabase link --project-ref <ref>` | Connect this folder to your hosted Supabase project |
| `npx supabase db push` | Apply new migrations to the linked hosted project |

## Testing the migrations

`tests/run.sh` applies every migration to a throwaway database on any Postgres 15+ server (with small
stand-ins for Supabase's `auth` and `storage` schemas) and checks the business rules: pricing, the
status flow, row-level security per role, document uploads, payments and the overdue job.

```bash
PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres ./tests/run.sh
```

Add a check to `tests/business-rules.test.sql` with every new rule.

The website's browser tests (`frontend/e2e`) run against the local stack too, with the demo data.

## Demo data

`supabase/seed.sql` fills the **local** database with demo data: 15 bookings,
20 customers, 15 leads, tasks, reviews, 6 staff accounts (one deactivated) and one website customer, all
signing in with the password `demo1234` (for example `admin@carrental.example`). It is generated from the
website's test fixtures, so edit those and regenerate it:

```bash
cd ../frontend && node scripts/generate-seed.mjs
```

The seed is never applied to a hosted project (`supabase db push` only applies migrations).

## Not done yet

- Emails about bookings (marked `EMAIL TRIGGER GOES HERE` in the functions and in `frontend/src/api`).
- A real payment gateway. Until then the website's mock payment confirms bookings without taking money.
- Cleaning up uploaded photos that never got attached to a booking.

## Connecting to Supabase from GitHub

In the Supabase dashboard, open **Project Settings → Integrations → GitHub**, connect this repository,
and set **Supabase directory** (working directory) to `backend`. Supabase then applies the migrations
in `backend/supabase/migrations/` when they are merged into the production branch.

## Secrets

Never commit keys. The frontend only ever gets the public URL and the anon (publishable) key. The
service-role key and the database password stay in Supabase, Vercel or a local `.env` file.
