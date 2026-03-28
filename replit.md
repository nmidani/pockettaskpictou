# Workspace

## Overview

PocketTask — a hyper-local microtask platform for Pictou County, Nova Scotia. Neighbours post small tasks and locals/students accept them for extra money.

Standalone Node.js API project using TypeScript, ready for Render deployment.

## Stack

- **Package manager**: npm
- **Node.js version**: 24
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod
- **Build**: esbuild (CJS bundle via build.ts)
- **Auth**: Replit Auth (OIDC + PKCE)
- **Payments**: Stripe

## Structure

```text
/
├── src/                    # All backend source code
│   ├── index.ts            # Server entry point (requires PORT env var)
│   ├── app.ts              # Express app setup (CORS, middleware, /api router)
│   ├── routes/             # Route handlers
│   │   ├── index.ts, auth.ts, tasks.ts, users.ts
│   │   ├── applications.ts, messages.ts, ratings.ts
│   │   ├── reports.ts, stripe.ts, admin.ts, health.ts
│   ├── middlewares/
│   │   └── authMiddleware.ts
│   ├── lib/                # Helpers
│   │   ├── auth.ts, userInfo.ts, haversine.ts
│   │   ├── trustScore.ts, assignmentScheduler.ts
│   ├── db/                 # Drizzle ORM schema + DB connection
│   │   ├── index.ts
│   │   └── schema/
│   └── api-zod/            # Generated Zod schemas
│       └── generated/
├── dist/                   # Build output (git-ignored)
│   └── index.cjs           # Single bundled file for production
├── build.ts                # esbuild script → dist/index.cjs
├── package.json            # Standalone Node.js app, no workspaces
├── tsconfig.json           # rootDir: src, outDir: dist
└── .npmrc
```

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `PORT=8080 NODE_ENV=development tsx ./src/index.ts` | Local development |
| `build` | `tsx ./build.ts` | Bundle `src/` → `dist/index.cjs` |
| `start` | `node dist/index.cjs` | Run production bundle |
| `typecheck` | `tsc --noEmit` | Type-check without emitting |

## Render Deployment

- **Build command**: `npm install && npm run build`
- **Start command**: `npm start`
- **Root directory**: `/` (repo root)

## Database Schema

- **sessions** — Auth session store (sid, sess JSON, expire)
- **tasks** — Task listings (title, description, category, pay, status, lat/lng, location)
- **applications** — Task applications (taskId, applicantId, message, status)
- **user_profiles** — Extended user data (bio, phone, tasksPosted, tasksCompleted, rating)
- **messages** — In-app messaging between task poster and applicant
- **ratings** — Post-task ratings
- **reports** — User and task reports

## API Routes

All routes served at `/api`:
- `GET /healthz` — health check
- `GET /auth/user` — current auth state
- `GET /login` — OIDC login
- `GET /callback` — OIDC callback
- `GET /logout` — logout
- `GET /tasks` — list tasks (filter by status, category, lat/lng)
- `POST /tasks` — create task (auth required)
- `GET /tasks/:id` — task details
- `PATCH /tasks/:id` — update task (owner only)
- `DELETE /tasks/:id` — delete task (owner only)
- `GET /tasks/:id/applications` — task applications (auth)
- `POST /tasks/:id/applications` — apply to task (auth)
- `PATCH /applications/:id` — accept/reject application (task owner)
- `GET /users/me` — current user profile (auth)
- `PATCH /users/me` — update profile (auth)
- `GET /conversations` — list conversations (auth)
- `GET /conversations/:id/messages` — message thread (auth)
- `POST /conversations/:id/messages` — send message (auth)
- `POST /ratings` — submit rating (auth)
- `POST /reports` — submit report (auth)
- `GET /admin/*` — admin routes (admin only)
- `POST /stripe/webhook` — Stripe webhook

## Environment Variables Required

- `PORT` — Server port (required, set by Render automatically)
- `DATABASE_URL` — PostgreSQL connection string
- `REPL_ID` — Replit project ID (for OIDC discovery)
- `REPLIT_DOMAINS` — Allowed redirect domains
- `SESSION_SECRET` — Express session secret
- `STRIPE_SECRET_KEY` — Stripe API key
- `ADMIN_EMAILS` — Comma-separated admin email addresses

## Colors / Branding

- Navy: `#1B2A4A`
- Amber: `#F5A623`
- Off-white: `#F9F7F4`
