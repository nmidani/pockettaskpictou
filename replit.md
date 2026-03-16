# Workspace

## Overview

PocketTask — a hyper-local microtask platform for Pictou County, Nova Scotia. Neighbours post small tasks and locals/students accept them for extra money.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS
- **Auth**: Replit Auth (OIDC + PKCE)
- **Map**: Mapbox GL + react-map-gl
- **PWA**: Service worker + manifest

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── pockettask/         # React+Vite frontend (served at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── replit-auth-web/    # Replit Auth browser hook
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **sessions** — Replit Auth session store (sid, sess JSON, expire)
- **tasks** — Task listings (title, description, category, pay, status, lat/lng, location)
- **applications** — Task applications (taskId, applicantId, message, status)
- **user_profiles** — Extended user data (bio, phone, tasksPosted, tasksCompleted, rating)

## API Routes

All routes served at `/api`:
- `GET /healthz` — health check
- `GET /auth/user` — current auth state
- `GET /login` — OIDC login
- `GET /callback` — OIDC callback
- `GET /logout` — logout
- `GET /tasks` — list tasks (filter by status, category)
- `POST /tasks` — create task (auth required)
- `GET /tasks/:id` — task details
- `PATCH /tasks/:id` — update task (owner only)
- `DELETE /tasks/:id` — delete task (owner only)
- `GET /tasks/:id/applications` — task applications (auth)
- `POST /tasks/:id/applications` — apply to task (auth)
- `PATCH /applications/:id` — accept/reject application (task owner)
- `GET /users/me` — current user profile (auth)
- `PATCH /users/me` — update profile (auth)
- `GET /users/me/tasks` — my posted tasks (auth)
- `GET /users/me/applications` — my applications (auth)

## Frontend Pages

- `/` — Landing page (hero, how it works, categories)
- `/dashboard` — Browse tasks + my activity (auth)
- `/map` — Mapbox map of tasks in Pictou County
- `/post-task` — Post a new task form (auth)
- `/tasks/:id` — Task detail + apply + manage applications
- `/profile` — User profile + stats

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection (auto-provisioned)
- `VITE_MAPBOX_TOKEN` — Mapbox public token for map view
- `REPL_ID` — Replit project ID (auto-set by Replit)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists lib packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **Codegen**: `pnpm --filter @workspace/api-spec run codegen`
- **DB push**: `pnpm --filter @workspace/db run push`
