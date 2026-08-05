# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **CBL LU Sukkur Plant HSE Management System** — a full-stack app with three
runnable pieces plus shared workspace packages:

- `backend/` — Node.js/Express REST API (port **5000**), MySQL + Sequelize, Redis (optional), Socket.IO.
- `apps/management-dashboard/` — React 19 + Vite SPA (port 5173).
- `packages/*` — shared TS packages (`@cbl/api`, `@cbl/auth`, `@cbl/ui`, `@cbl/tsconfig`, `@cbl/eslint-config`) consumed by the frontend.
- MySQL 8 (db `cbl_db`, user `root`, password `secret`) and Redis are started with `service mysql start` / `service redis-server start` (this VM has no systemd). Connect to MySQL over TCP (`-h 127.0.0.1`); the unix socket rejects non-root local connections.

### Running the services

- **Backend:** from `backend/`, ensure `.env` exists (already created; key values: `DB_HOST=127.0.0.1`, `DB_PASSWORD=secret`, `DB_NAME=cbl_db`, generated JWT secrets, `ENCRYPTION_KEY` must be exactly 32 chars). Start with `npm run dev` (nodemon). Health check: `curl localhost:5000/api/health`.
  - Nodemon only watches `src/**`. If you edit `server.js` or other root-level files, it will **not** auto-restart — type `rs` in the nodemon terminal (or restart it).
- **Frontend:** run `npm run dev` at the repository root. This uses Turborepo to start the Vite dev server for `apps/management-dashboard`. Open http://localhost:5173.
  - **Must bind `--host 0.0.0.0`**: plain `vite` / `npm run dev` binds only to IPv6 `::1`, which causes `ERR_CONNECTION_RESET` / connection refused from the Cursor browser pane and from `127.0.0.1`. Confirm with `ss -tlnp | grep 5173` — you want `0.0.0.0:5173`, not `::1:5173`.
  - `apps/management-dashboard/.env` sets `VITE_API_URL=http://localhost:5000/api/v1` and `VITE_BYPASS_AUTH=true`. Bypass mode renders the full dashboard UI with a fake preview identity but sends **no** JWT, so backend calls return 401 (expected).

### Database migrations / seeders (important gotchas)

- `.sequelizerc` points `config` at a non-existent `src/config/database.js`, and `npm run migrate` / `npm run seed` are broken (wrong logger path / missing `scripts/seed.js`). Use the Sequelize CLI with an explicit config instead:
  - `npx sequelize-cli db:migrate --config src/database/config/database.js`
  - `npx sequelize-cli db:seed:all --config src/database/config/database.js`
- Seeders are **not idempotent** — re-running `db:seed:all` after a successful seed fails with a duplicate-key "Validation error" on roles. That's harmless if the data is already seeded (superadmin `superadmin@cblapp.com` / `Admin@123!`, 4 roles, 77 permissions, 2 plants, 3 departments).

### Shared-package wiring (Turborepo Structure)

The monorepo uses npm workspaces defined in the root `package.json` (`apps/*` and `packages/*`).
A standard `npm install` from the root directory handles all dependencies and symlinks `@cbl/*` packages automatically.
Do NOT create manual symlinks for `@cbl/*` or `react`. The Turborepo structure natively resolves this.

### Lint / test

- Backend lint: `npm run lint` (ESLint) in `backend/`. Backend tests: `npm test` (Jest) — note the test files under `backend/tests/` reference stale pre-refactor paths and will need path fixes before they run.
- Frontend lint: `npm run lint` (oxlint) in `apps/management-dashboard/` or run `npm run lint` from the root to lint all apps and packages.

### Known pre-existing issues (NOT environment problems)

This repo is mid-refactor; a few application-level things are incomplete (fixing them is app work, not env setup):

- Backend **login / authenticated CRUD is broken**: the core Sequelize models (`src/modules/users/user.model.js`, `role.model.js`, …) are minimal stubs that don't match the migrations (missing `password`, `withPassword` scope, `first_name`, UUID id, etc.). `POST /api/v1/auth/login` returns `Invalid scope withPassword called`, and all authed endpoints therefore 401/500.
- Swagger UI at `/api/docs` shows "No operations defined" because `src/database/config/swagger.js` scans a stale path (`./src/api/v1/routes/*.js`).
