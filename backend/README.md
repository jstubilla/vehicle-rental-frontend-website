# Backend (Supabase)

This folder is the Supabase project for the car rental site. It holds everything that lives in the
database: tables, row-level security policies, database functions, seed data and edge functions.
It does not depend on anything in `frontend/`.

```
backend/
└── supabase/
    ├── config.toml     # Supabase settings (used by the CLI and the local stack)
    ├── migrations/     # SQL migrations, applied in filename order
    ├── functions/      # Edge functions (server code, e.g. payment webhooks)
    └── seed.sql        # Demo data loaded by `supabase db reset` (not created yet)
```

## Working on it

You need the [Supabase CLI](https://supabase.com/docs/guides/cli). Run every command from this
`backend/` folder. `npx supabase` works without installing it.

| Command | What it does |
| --- | --- |
| `npx supabase migration new <name>` | Create a new, empty migration file in `supabase/migrations/` |
| `npx supabase start` | Run a local Supabase stack (needs Docker) |
| `npx supabase db reset` | Rebuild the local database from the migrations and `seed.sql` |
| `npx supabase link --project-ref <ref>` | Connect this folder to your hosted Supabase project |
| `npx supabase db push` | Apply new migrations to the linked hosted project |

## Connecting to Supabase from GitHub

In the Supabase dashboard, open **Project Settings → Integrations → GitHub**, connect this repository,
and set **Supabase directory** (working directory) to `backend`. Supabase then applies the migrations
in `backend/supabase/migrations/` when they are merged into the production branch.

## Secrets

Never commit keys. The frontend only ever gets the public URL and the anon (publishable) key. The
service-role key and the database password stay in Supabase, Vercel or a local `.env` file.
