# CBL LU Sukkur Plant HSE Management System

Full-stack Health, Safety and Environment management system for CBL plant operations. The application consolidates leading and lagging indicators, incident and hazard workflows, audit execution, CAPA actions, training, analytics, reports, and controlled master data.

## Architecture

- `apps/management-dashboard` — React 19, TypeScript, Vite, Tailwind CSS, React Router, Recharts, MSAL, and Socket.IO client.
- `backend` — Node.js, Express, Sequelize, MySQL 8, JWT application sessions, Microsoft Entra token validation, Socket.IO, and optional Redis.
- `packages/api` — shared Axios clients and API types.
- `packages/auth` — MSAL integration, authenticated user state, and frontend permission helpers.
- `packages/ui` — shared UI components.

The frontend uses paginated REST APIs. Dashboard charts use database aggregation (`COUNT`, `SUM`, and grouped queries); they do not download full operational tables to calculate charts.

## Authentication and RBAC

Microsoft Entra ID is the normal sign-in authority. The SPA obtains a Microsoft token with MSAL, the backend validates its signature, issuer, and audience, maps the Entra identity to an application user, then issues/uses the existing application JWT session. Application users carry roles, department assignments, and persisted permissions.

Important roles include System Administrator, Administrator, HSE Manager, HSE Officer, Department Manager, Data Entry Operator, and Viewer. Authorization is enforced by Express middleware. Frontend button visibility is only a convenience and is not the security boundary.

`PREVIEW_AUTH` and `VITE_BYPASS_AUTH` are development-only emergency preview switches. They default to `false`; the production backend refuses preview authentication, and production frontend builds cannot activate it.

## Master data

Plants, Departments, Locations, Employees, Users, Roles, and Permissions are database-backed master data. New-record department selectors read active Departments from `/api/v1/departments/active`, display a readable code/name, and start empty unless the department is intentionally derived from an employee lookup. Inactive departments remain readable on historical records but are excluded from new selections.

## Main workflows

### Hazard Reporting

Hazards store reporting department, location, category, type, risk, corrective action, responsible person/department, target date, status, and evidence. A Department Manager can submit closure only for a hazard assigned to their own department. Submission moves the hazard to HSE review; only an authorized HSE Manager can approve final closure. Hazards marked for further investigation create one source-linked Incident Investigation, with duplicate prevention.

Historical Hazard status correction treats the workbook column `Pending` as the status source. `Pending` maps to the canonical in-progress/pending state and `Done` maps to Closed. The correction script fingerprints imported rows and does not overwrite unrelated manual records.

### Near Miss

Near Miss records include reporting and responsible departments, preventive action, investigation/reporting flags, status, and remarks. Further-investigation records link idempotently to Incident Investigation. Meaningful preventive actions synchronize to CAPA.

### Accident and Incident flow

Accident Reporting is the generic entry form for the canonical `incidents` table. The Incident Category selects First Aid, MTC, RWC, LTI, Fatality, Fire, or another configured existing category. Lagging Indicator pages are server-filtered views of the same records; records are not physically duplicated.

### Incident Investigation and CLC

Incident Investigation retains source traceability to the originating incident, Near Miss, or Hazard. Its form includes actions, responsibility, target/completion fields, verification, and Safety Incident Pictures. The CLC cause-analysis appendix persists structured multi-select Primary Causes and Root Causes, including Other/specify text. Printed investigations include the existing report first and force the CLC appendix to a new page.

### Critical Audit Plan and Audit Logs

Critical Audit Plan imports scheduled audit definitions and creates linked audit occurrences. Audit Logs contain both scheduled and manually created audits in the same `audits` and `audit_findings` tables. Their `source` distinguishes `critical-audit-plan` from `manual`. Both support the same Audit Format, scoring, responsible department, recommendations, status, editing, printing, reports, analytics, and CAPA synchronization. The consolidated register is ordered by creation time (newest first) so a newly saved manual audit is immediately visible.

### CAPA / Actions

The consolidated CAPA register uses source-linked records derived from actionable Hazard, Near Miss, Incident Investigation, and Audit items. `source_type + source_id + source_item_key` is unique, so source edits synchronize an existing CAPA rather than creating duplicates. The first workflow intentionally uses only Open, In Progress, and Closed states.

### Training

Registered Training records are classified by their date in the backend: today/past dates are `completed`, future dates are `scheduled`, while explicit drafts, cancellations, and in-progress workflow states are preserved. Optional attendance proof uses the shared polymorphic `attachments` table with `source_type=training` and `attachment_type=ATTENDANCE_PROOF`; the form and upload API accept JPG/JPEG/PNG images up to 10 MB.

Training stores type, department, trainer, date, venue, participants, duration, status, and calculated manhours. Manhours are persisted/aggregated as `participant_count × duration_minutes / 60` when no explicit stored value exists. Dashboard “participants” are summed participant attendances; individual participant identities are not stored, so this is not a unique-person count.

### Dashboard and reports

Dashboard KPIs and configurable charts use real backend aggregations. The Hazard comparison is the current calendar month (or the month containing a selected `toDate`) versus its immediately preceding calendar month. The Incident comparison is the current calendar year (or selected year/`toDate` year) versus the preceding calendar year. Selected global department/status/risk filters are retained; comparison date windows replace only the dashboard date filter.

Reports use the generated filtered preview as the print source and provide server-side, escaped CSV export for the full filtered result. Print CSS excludes application navigation and controls.

### Attachments and pagination

Attachments use a one-to-many polymorphic table keyed by source type and source ID. Incident/Accident evidence supports up to four JPEG/PNG images, 10 MB each, with frontend and backend validation. Local uploads are runtime data and are not committed.

List screens use backend pagination and the shared first/previous/page/next/last control. Filters reset the page to 1 and are sent to the API.

## Local setup

Prerequisites: Node.js 20.19+ (or 22.12+), npm 10+, MySQL 8, and optionally Redis 7. This Node requirement comes from the installed Vite 8 toolchain.

1. Install workspace and backend dependencies:

   ```powershell
   npm install
   npm --prefix backend install
   ```

2. Copy environment templates and replace every placeholder:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item apps/management-dashboard/.env.example apps/management-dashboard/.env
   ```

3. Create the empty MySQL database and grant the configured application user access.

4. Apply all migrations and idempotent master/RBAC seeds:

   ```powershell
   npm run db:setup
   ```

   `db:setup` can be rerun safely. Set `SEED_ADMIN_EMAIL` in `backend/.env` only when an initial application administrator is required. `SEED_ADMIN_PASSWORD` is optional for Entra-only users and is never stored in source control.

5. Start the API and SPA in separate terminals:

   ```powershell
   npm --prefix backend run dev
   npm run dev
   ```

6. Verify `http://localhost:5000/api/health` and open `http://localhost:5173`.

## Database lifecycle

Schema changes belong in `backend/src/database/migrations`. Required master/RBAC data belongs in the idempotent `backend/scripts/seed.js`. Never use `sequelize.sync({ force: true })` for deployment.

Useful commands:

```powershell
npm run db:migrate
npm run db:seed
npm run db:setup
npm --prefix backend run migrate:undo
```

Historical workbooks must be supplied separately through an organization-approved secure channel because they can contain operational or personal data. Inspect first, run dry-run where supported, review the JSON report, then commit:

```powershell
npm --prefix backend run import:incidents -- --injury C:\secure\injuries.xlsx --fire C:\secure\fire.xlsx --dry-run
npm --prefix backend run import:incidents -- --injury C:\secure\injuries.xlsx --fire C:\secure\fire.xlsx --commit
npm --prefix backend run correct:hazard-statuses -- --input C:\secure\hazards.xlsx
npm --prefix backend run correct:hazard-statuses -- --input C:\secure\hazards.xlsx --commit
npm --prefix backend run import:critical-audit-plan -- C:\secure\critical-audit-plan.xlsx
npm --prefix backend run backfill:capa -- --dry-run
npm --prefix backend run backfill:capa -- --apply
```

These import/correction paths use source metadata, fingerprints, or source-item uniqueness so reruns do not duplicate historical records.

### Git database-artifact status and security warning

The Git history on `origin/main` currently contains two legacy SQL files:

- `cbl_db_full_backup.sql` is a stale MySQL snapshot. It contains token rows and a password hash and is **not sanitized or approved for deployment**. Its record counts also do not match the current application database.
- `backend/storage/mysql.sql` is an early bootstrap schema/data script and no longer represents the current Sequelize model or migration set.

Do not restore either file on a new system. Because the first file was already pushed, removing it in a later commit does not remove it from Git history. Before making the repository public or treating it as a deployment source, rotate all JWT/session secrets, invalidate old sessions, remove the dump from the current branch, and coordinate an approved Git-history purge with every clone/fork owner. The project `.gitignore` prevents new `.sql`/`.dump` files from being added accidentally, but it cannot untrack files that were committed earlier.

The supported database deployment artifacts are `backend/src/database/migrations/*.js`, the idempotent `backend/scripts/seed.js`, and the reviewed import/correction scripts in `backend/scripts`. A fresh clone receives schema and safe master data, but it will not receive the current 5,000+ operational/historical records unless the organization separately supplies and runs the reviewed source workbooks or creates an approved sanitized snapshot. If a demo snapshot is required, remove authentication/session tables, anonymize personal data, review it for confidential content, and transfer it through the organization's approved secure data process.

## Docker database option

The Compose file runs MySQL and Redis only; application processes can still run with the commands above.

```powershell
Copy-Item docker-compose.env.example docker-compose.env
# Replace both passwords in docker-compose.env
docker compose --env-file docker-compose.env up -d db redis
npm run db:setup
```

Set backend `DB_HOST=127.0.0.1` for this host-run API. Docker volumes preserve runtime database data and are never committed.

## Deployment to a fresh Windows system

### 1. Prerequisites and clone

Install Git, MySQL 8, Node.js 20.19+ LTS (or 22.12+), and npm 10. Docker Desktop is optional and is needed only when using the Compose database option. Then run:

```powershell
git clone https://github.com/Talha-Waheedd/HSE-Dashboard.git C:\Apps\HSE-Dashboard
Set-Location C:\Apps\HSE-Dashboard
git checkout main
git pull --ff-only origin main
node --version
npm --version
mysql --version
```

Install the npm workspace and the separate backend dependencies:

```powershell
npm install
npm --prefix backend install
```

### 2. Environment files

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item apps\management-dashboard\.env.example apps\management-dashboard\.env
npm --prefix backend run generate:key
```

Copy the generated secrets into `backend/.env`; never commit that file. Configure these values:

- Application: `NODE_ENV=production`, `PORT`, public `APP_URL`, HTTPS `CLIENT_URL`, and comma-separated `ALLOWED_ORIGINS`.
- MySQL: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, pool settings, and `DB_SSL`/`DB_SSL_REJECT_UNAUTHORIZED` when required by the target service.
- Security: independent `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_VERIFY_SECRET`, `JWT_RESET_SECRET`, their expiries, and an exactly 32-character `ENCRYPTION_KEY`.
- Entra: `MSAL_CLIENT_ID` and `MSAL_TENANT_ID` on the backend; matching `VITE_MSAL_CLIENT_ID`, `VITE_MSAL_TENANT_ID`, and the exact HTTPS SPA URL in `VITE_MSAL_REDIRECT_URI` on the frontend.
- Frontend/API: `VITE_API_URL=https://api.example.org/api/v1` (or the equivalent reverse-proxied URL) and the deployed `VITE_DEFAULT_PLANT_ID`.
- Storage: `STORAGE_DRIVER=local` stores evidence beneath backend runtime `public/uploads`, `uploads`, and `storage`; make those paths persistent and writable by the API service account. For S3, set the AWS key, secret, region, and bucket through the host secret store.
- Optional services: Redis, SMTP/SendGrid, logging, and rate-limit variables may retain the documented defaults if those integrations are unused.
- Safety switches: production requires `PREVIEW_AUTH=false`, `VITE_BYPASS_AUTH=false`, `ALLOW_UNVERIFIED_HAZARD_EMPLOYEE=false`, `VITE_ALLOW_UNVERIFIED_HAZARD_EMPLOYEE=false`, `BYPASS_HAZARD_VALIDATION=false`, and `VITE_BYPASS_HAZARD_VALIDATION=false`. The backend refuses unsafe server-side development flags in production; the frontend flags must be false before the production bundle is built.

Vite variables are compiled into the browser bundle and are not secrets. Build again whenever a `VITE_*` value changes.

### 3. MySQL schema and data

Create an empty UTF-8 database and a least-privilege application account. Substitute your own database name/user and enter passwords interactively or through the organization's secret tooling:

```powershell
mysql -u root -p -e "CREATE DATABASE cbl_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER 'cbl_app'@'%' IDENTIFIED BY 'REPLACE_INTERACTIVELY'; GRANT ALL PRIVILEGES ON cbl_db.* TO 'cbl_app'@'%'; FLUSH PRIVILEGES;"
npm run db:setup
npm run db:setup
```

The second `db:setup` is an idempotency check: it must apply zero new migrations and must not duplicate Roles, Permissions, Departments, or Locations. Do not run `db:fresh` against an existing environment because it rolls back the schema. Do not restore `cbl_db_full_backup.sql` or `backend/storage/mysql.sql`.

If historical data is required, securely transfer the reviewed source workbooks and run the dry-run/import commands in the Database lifecycle section. Run `npm --prefix backend run backfill:capa -- --dry-run`, review it, then use `--apply`. Finally run:

```powershell
npm --prefix backend run verify:deployment
npm --prefix backend run verify:capa
```

The JSON output supplies database/dashboard counts and duplicate/source-link checks. Compare expected deployment counts with the approved import reports; Git alone does not contain the current operational data.

### 4. Microsoft Entra and application RBAC

Create or reuse a single-tenant Entra application registration. Add a **Single-page application** redirect URI that exactly equals `VITE_MSAL_REDIRECT_URI` (for example `https://hse.example.org`), allow the `User.Read` delegated scope, and use the same tenant/client IDs in frontend and backend settings. The backend validates the Microsoft token with the tenant JWKS, issuer `https://login.microsoftonline.com/<tenant-id>/v2.0`, and the configured client ID as audience; it does not merely decode an unsigned token.

Every person must also exist as an active application user in MySQL. Assign the application Role and employee/Department mapping before login. On first successful Microsoft login the verified Entra `oid` is bound to that application user; subsequent login resolves by the immutable object ID. Do not grant Azure administrative roles for HSE application access.

### 5. Development startup

Use development values and `PREVIEW_AUTH=false` for a real authentication test. Start two terminals:

```powershell
# Terminal 1
npm --prefix backend run dev

# Terminal 2
npm run dev
```

The SPA is `http://localhost:5173`, the API base is `http://localhost:5000/api/v1`, and health is `http://localhost:5000/api/health`.

### 6. Production build and startup

```powershell
npm run build
npm --prefix backend start
```

The frontend output is `apps/management-dashboard/dist`. The Express API does not serve that SPA build; host it as an HTTPS static site with IIS, Nginx, or the organization's web platform. Configure SPA fallback to `index.html`, send `/api/v1` (and Socket.IO if used) to the Node API, preserve authorization headers, and set request/upload limits above 10 MB per evidence image. Run the API under a Windows Service/process supervisor rather than an interactive terminal, persist the upload directories, and terminate TLS at the approved reverse proxy.

Verify startup and connectivity:

```powershell
Invoke-RestMethod https://api.example.org/api/health
Invoke-WebRequest https://hse.example.org
```

Then confirm Microsoft login, `GET /api/v1/auth/me`, dashboard values, Department/Location master data, one paginated filtered list, one save/edit/reload path, report CSV, browser Print/PDF, attachment persistence, and the Department Manager/HSE Manager Hazard closure matrix. A `401` without a token and `403` for a valid but unauthorized user are expected security results.

GitHub stores application source, migrations, seed/import logic, and safe templates. It does not run MySQL or automatically restore database records.

## Verification commands

```powershell
npm run build
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run verify:deployment
npm --prefix backend run verify:capa
npm --prefix backend run verify:manual-entry
npm --prefix backend run verify:attachments
npm --prefix backend run verify:hazard-rbac
curl http://localhost:5000/api/health
```

Backend tests under `backend/tests` include legacy suites that may require path maintenance as modules evolve. A passing production build does not replace API/database and workflow verification.

## Deployment troubleshooting

- `mysql` is not recognized: install the MySQL 8 client/server tools and add the MySQL `bin` directory to the Windows service account's `PATH`.
- API health fails: check the API service logs, `PORT`, MySQL settings, firewall rules, and `Invoke-RestMethod http://127.0.0.1:5000/api/health` locally on the server.
- Microsoft sign-in returns 404/unauthorized: confirm the deployed SPA was rebuilt with the correct `VITE_API_URL`, tenant/client IDs, and exact redirect URI; then confirm the Entra user has a matching active application user with Role and Department assignments.
- Protected APIs return 401: verify `Authorization: Bearer <application-access-token>` reaches Express through the reverse proxy. `PREVIEW_AUTH` is not a production login mechanism.
- Browser CORS errors: add only the exact deployed HTTPS SPA origin to `ALLOWED_ORIGINS`; do not use a wildcard with authenticated requests.
- Uploaded evidence disappears after restart: move local upload folders to persistent storage and grant the API service account read/write access, or configure the approved S3 storage driver.
- `npm test` currently reports legacy harness failures: `tests/unit/services/auth.service.test.js` uses a stale relative repository path and `tests/integration/auth.test.js` needs Jest ESM handling for `uuid`. Use the passing production build and dedicated deployment/RBAC workflow suites above while those test-harness issues are repaired; do not misreport the full Jest suite as passing.

## Documentation rule

Update this README with every meaningful change that affects architecture, setup, database schema/data lifecycle, workflows, important modules, deployment, or public APIs. Small visual-only adjustments do not require a README entry.
