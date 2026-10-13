# Car Rental Co.

The repository has two parts. Each one is a separate project with its own dependencies, so you can
work on or deploy one without the other.

| Folder | What it is | Deploys to |
| --- | --- | --- |
| [`frontend/`](frontend) | The Next.js website and admin area. Today it still runs on mock data in the browser. See [`frontend/README.md`](frontend/README.md). | Vercel, with **Root Directory** set to `frontend` |
| [`backend/`](backend) | The Supabase project: database migrations, seed data and edge functions. See [`backend/README.md`](backend/README.md). | Supabase, with the GitHub integration's **Working directory** set to `backend` |

`car-rental-skeleton-source.zip` is an archived snapshot of the original front-end source.
