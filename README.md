# CBL LU Sukkur Plant HSE Management System

Full-stack Health, Safety and Environment management system for CBL plant operations. The application consolidates leading and lagging indicators, incident and hazard workflows, audit execution, CAPA actions, training, analytics, reports, and controlled master data.

## Architecture

- `apps/management-dashboard` — React 19, TypeScript, Vite, Tailwind CSS, React Router, Recharts, MSAL, and Socket.IO client.
- `backend` — Node.js 18+, Express, Sequelize, MySQL 8, JWT application sessions, Microsoft Entra token validation, Socket.IO, and optional Redis.
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

Critical Audit Plan imports scheduled audit definitions and creates linked audit occurrences. Audit Logs contain both scheduled and manually created audits in the same `audits` and `audit_findings` tables. Their `source` distinguishes `critical-audit-plan` from `manual`. Both support the same Audit Format, scoring, responsible department, recommendations, status, editing, printing, reports, analytics, and CAPA synchronization.

### CAPA / Actions

The consolidated CAPA register uses source-linked records derived from actionable Hazard, Near Miss, Incident Investigation, and Audit items. `source_type + source_id + source_item_key` is unique, so source edits synchronize an existing CAPA rather than creating duplicates. The first workflow intentionally uses only Open, In Progress, and Closed states.

### Training

Training stores type, department, trainer, date, venue, participants, duration, status, and calculated manhours. Manhours are persisted/aggregated as `participant_count × duration_minutes / 60` when no explicit stored value exists. Dashboard “participants” are summed participant attendances; individual participant identities are not stored, so this is not a unique-person count.

### Dashboard and reports

Dashboard KPIs and configurable charts use real backend aggregations. The Hazard comparison is the current calendar month (or the month containing a selected `toDate`) versus its immediately preceding calendar month. The Incident comparison is the current calendar year (or selected year/`toDate` year) versus the preceding calendar year. Selected global department/status/risk filters are retained; comparison date windows replace only the dashboard date filter.

Reports use the generated filtered preview as the print source and provide server-side, escaped CSV export for the full filtered result. Print CSS excludes application navigation and controls.

### Attachments and pagination

Attachments use a one-to-many polymorphic table keyed by source type and source ID. Incident/Accident evidence supports up to four JPEG/PNG images, 10 MB each, with frontend and backend validation. Local uploads are runtime data and are not committed.

List screens use backend pagination and the shared first/previous/page/next/last control. Filters reset the page to 1 and are sent to the API.

## Local setup

Prerequisites: Node.js 18+, npm 10+, MySQL 8, and optionally Redis 7.

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

Historical workbooks are supplied separately from Git because they can contain operational or personal data. Inspect first, run dry-run where supported, review the JSON report, then commit:

```powershell
npm --prefix backend run import:incidents -- --injury C:\secure\injuries.xlsx --fire C:\secure\fire.xlsx --dry-run
npm --prefix backend run import:incidents -- --injury C:\secure\injuries.xlsx --fire C:\secure\fire.xlsx --commit
npm --prefix backend run correct:hazard-statuses -- --input C:\secure\hazards.xlsx
npm --prefix backend run correct:hazard-statuses -- --input C:\secure\hazards.xlsx --commit
npm --prefix backend run import:critical-audit-plan -- C:\secure\critical-audit-plan.xlsx
npm --prefix backend run backfill:capa -- --dry-run
npm --prefix backend run backfill:capa -- --commit
```

These import/correction paths use source metadata, fingerprints, or source-item uniqueness so reruns do not duplicate historical records.

No SQL snapshot is committed. The repository deliberately ignores `.sql`, `.dump`, database runtime files, environments, tokens, private keys, logs, and uploads. If a demo snapshot is required, generate it through the organization’s approved secure data process, remove authentication/session tables, anonymize personal data, and transfer it outside public Git.

## Docker database option

The Compose file runs MySQL and Redis only; application processes can still run with the commands above.

```powershell
Copy-Item docker-compose.env.example docker-compose.env
# Replace both passwords in docker-compose.env
docker compose --env-file docker-compose.env up -d db redis
npm run db:setup
```

Set backend `DB_HOST=127.0.0.1` for this host-run API. Docker volumes preserve runtime database data and are never committed.

## Deployment to another system

1. Clone the repository and install dependencies.
2. Provision MySQL/Redis through organizational infrastructure or Compose.
3. Create `backend/.env` and the frontend production environment from the examples; use production Entra, database, JWT, storage, CORS, and HTTPS values. Set `DB_SSL=true` only when the target MySQL service requires TLS, and keep certificate verification enabled unless the organization explicitly provides a different trust policy.
4. Run `npm run db:setup` against the target database.
5. Run reviewed historical import commands from securely transferred workbooks, if that deployment requires historical/demo records.
6. Build with `npm run build` and start the API with `npm --prefix backend start` under a process supervisor.
7. Serve the SPA build over HTTPS and route its configured `/api/v1` URL to the backend.
8. Perform health, authentication, RBAC, pagination, report export, and attachment smoke tests before cutover.

GitHub stores application source, migrations, seed/import logic, and safe templates. It does not host or automatically restore MySQL; migration and data-import steps are required on every new environment.

## Verification commands

```powershell
npm run build
npm --prefix backend run lint
npm --prefix backend test
curl http://localhost:5000/api/health
```

Backend tests under `backend/tests` include legacy suites that may require path maintenance as modules evolve. A passing production build does not replace API/database and workflow verification.

## Documentation rule

Update this README with every meaningful change that affects architecture, setup, database schema/data lifecycle, workflows, important modules, deployment, or public APIs. Small visual-only adjustments do not require a README entry.
