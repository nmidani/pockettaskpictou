# Workspace

## Overview

PocketTask — a hyper-local microtask platform for Pictou County, Nova Scotia. Neighbours post small tasks and locals/students accept them for extra money.

Standalone Node.js API project using TypeScript, ready for Render deployment. The Express backend also serves the built React frontend as static files.

## Stack

**Backend:**
- **Package manager**: npm
- **Node.js version**: 24
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod
- **Build**: esbuild (CJS bundle via build.ts)
- **Auth**: Replit Auth (OIDC + PKCE)
- **Payments**: Stripe

**Frontend (`client/`):**
- **Framework**: React 19 + Vite 6
- **Routing**: Wouter
- **Data fetching**: TanStack React Query
- **Styling**: Tailwind CSS v4
- **UI components**: Radix UI / shadcn-style components
- **Maps**: Leaflet + react-leaflet
- **API URL**: `https://pockettask-3.onrender.com` (via `VITE_API_URL` env var)

## Structure

```text
/
├── src/                    # Backend source code
│   ├── index.ts            # Server entry point (requires PORT env var)
│   ├── app.ts              # Express app: serves /api routes + React static files
│   ├── routes/             # Route handlers
│   │   ├── index.ts, auth.ts, tasks.ts, users.ts
│   │   ├── applications.ts, messages.ts, ratings.ts
│   │   ├── reports.ts, stripe.ts, admin.ts, health.ts
│   ├── middlewares/
│   │   └── authMiddleware.ts
│   ├── lib/
│   │   ├── auth.ts, userInfo.ts, haversine.ts
│   │   ├── trustScore.ts, assignmentScheduler.ts
│   ├── db/
│   │   ├── index.ts
│   │   └── schema/
│   └── api-zod/
│       └── generated/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx         # Root component with AuthProvider + Router
│   │   ├── main.tsx        # Entry point
│   │   ├── index.css       # Tailwind base styles
│   │   ├── lib/
│   │   │   ├── api.ts      # API_BASE URL + apiFetch helper
│   │   │   ├── auth.tsx    # AuthProvider + useAuth hook
│   │   │   └── hooks.ts    # React Query hooks + TypeScript types
│   │   ├── components/     # Layout, auth-modal, task-card, shadcn UI
│   │   └── pages/          # landing, dashboard, map-view, post-task,
│   │                       # task-details, profile, messages, guidelines
│   ├── public/             # favicon, manifest.json, sw.js, images
│   ├── index.html          # SPA entry point
│   ├── vite.config.ts      # Clean Vite config (no Replit plugins)
│   ├── tsconfig.json       # Standalone TypeScript config
│   └── package.json        # Standalone npm package
├── dist/                   # Backend build output (git-ignored)
│   └── index.cjs
├── build.ts                # esbuild script → dist/index.cjs
├── package.json            # Root scripts including build:all
├── drizzle.config.ts
└── tsconfig.json
```

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `PORT=8080 NODE_ENV=development tsx ./src/index.ts` | Local development (serves both API + built frontend) |
| `build` | `tsx ./build.ts` | Bundle server: `src/` → `dist/index.cjs` |
| `build:client` | `npm install --prefix client && npm run build --prefix client` | Build React frontend → `client/dist/` |
| `build:all` | `npm run build:client && npm run build` | Build everything |
| `start` | `node dist/index.cjs` | Run production bundle |
| `db:push` | `drizzle-kit push` | Push schema to database |

## Render Deployment

- **Build command**: `npm install && npm run build:all && npm run db:push`
- **Start command**: `npm start`
- **Root directory**: `/` (repo root)
- **Backend URL**: `https://pockettask-3.onrender.com`

## How Frontend Auth Works

`client/src/lib/auth.tsx` provides `useAuth()` via React context:
- Fetches `GET /api/auth/user` on mount to check session
- `login()` redirects to `https://pockettask-3.onrender.com/api/login`
- `logout()` redirects to `https://pockettask-3.onrender.com/api/logout`
- Override the base URL via `VITE_API_URL` environment variable in `client/.env`

## Database Schema

- **sessions** — Auth session store
- **tasks** — Task listings (title, description, category, pay, status, lat/lng)
- **applications** — Task applications
- **user_profiles** — Extended user data (bio, phone, ratings, trust score)
- **messages** — In-app messaging
- **ratings** — Post-task ratings
- **reports** — User/task reports

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
- `GET /tasks/:id/applications` — task applications
- `POST /tasks/:id/applications` — apply to task (auth)
- `PATCH /applications/:id` — accept/reject application
- `GET /users/me` — current user profile
- `PATCH /users/me` — update profile
- `GET /conversations` — list conversations
- `GET /conversations/:id/messages` — message thread
- `POST /conversations/:id/messages` — send message
- `POST /ratings` — submit rating
- `POST /reports` — submit report
- `GET /admin/*` — admin routes (admin only)
- `POST /stripe/webhook` — Stripe webhook

## Environment Variables

**Backend (Render):**
- `PORT` — Set automatically by Render
- `DATABASE_URL` — PostgreSQL connection string
- `REPL_ID` — Replit project ID (for OIDC)
- `REPLIT_DOMAINS` — Allowed redirect domains
- `SESSION_SECRET` — Express session secret
- `STRIPE_SECRET_KEY` — Stripe API key
- `ADMIN_EMAILS` — Comma-separated admin emails (e.g. `nassim.dawai@gmail.com`)

**Frontend (optional `.env` in `client/`):**
- `VITE_API_URL` — Override API base URL (defaults to `https://pockettask-3.onrender.com`)

## Colors / Branding

- Navy: `#1B2A4A`
- Amber: `#F5A623`
- Off-white: `#F9F7F4`
