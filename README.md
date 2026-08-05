# 🏗️ CBL LU Sukkur Plant — Full Stack Management System

> A comprehensive, end-to-end HSE (Health, Safety, and Environment) Management System for Continental Biscuits Limited's (CBL) LU Power Plant. Includes a React/Vite unified frontend dashboard and a Node.js/Express enterprise backend REST API.

---

## 📑 Unified Project Documentation

This repository contains both the **Frontend Application**, **Backend REST API**, and the
enterprise MySQL schema. The frontend is connected to the live API layer; preview
authentication is explicitly environment-controlled and is not enabled by default.

* **Frontend Documentation**: See [Frontend Section](#-frontend-management-dashboard) below.
* **Backend Documentation**: See [Backend Section](#-cbl-backend-api) below.

---

<a name="frontend"></a>
# 💻 Frontend: Management Dashboard

## 🚀 Overview

This is the **frontend monorepo** for the CBL LU Power Plant Management System. It's a React/Vite application built with a modular **Turborepo + npm workspaces** architecture, fully branded in the official **LU theme** (Maroon, Amber, Cream, Caramel) with complete Dark/Light mode support.

The dashboard consolidates what used to be two separate views (employee + management) into a **single, unified management dashboard**, with data scoped by backend identity, role, permission, plant, and department.

The frontend uses centralized Axios clients, live REST APIs, JWT token handling,
Socket.IO notifications, server-side pagination/filtering, backend uploads, and
backend report/export services. Mock API activation and localStorage CRUD have
been removed.

---

## 🏗️ What We Are Building

The goal is to deliver a comprehensive, end-to-end HSE (Health, Safety, and Environment) Management System for the LU Sukkur Plant. This involves digitizing manual records, providing real-time data visualizations, tracking incident closures, managing audits/inspections, and enforcing accountability through an automated Action Tracker (CAPA).

---

## ✅ What Has Been Built (Accomplished)

The frontend foundation is complete, highly modular, and aesthetically polished. The following features and phases have been successfully implemented:

### Phase 1 & Phase 2 Modules
A single, config-driven component (`DataEntrySection.tsx`) powers **seven independent modules**, each with its own form, editable table, inline delete/save, and CSV export. 
1. ⚠️ **Hazard Reporting**
2. 🎯 **Near Miss**
3. 📋 **Incident Log**
4. ✅ **Action Tracker (CAPA)**
5. 📚 **Training Records** (Departmental & Activity)
6. 📝 **Audit Management** *(Phase 2)*
7. 🔍 **Inspection Records** *(Phase 2)*

### Dynamic Dashboard & KPI Visualizations
- **Main KPI Hub:** API-backed metrics counting hazards, incidents, training, audits, inspections, and corrective actions.
- **Leading & Lagging Indicators:** Detailed modals displaying metric breakdowns (e.g., Fatalities, LTI, LTIR, TRIR, Hazard Spotting) equipped with deep-links clicking through directly to their respective reporting modules.
- **Charts:** Donut charts for Hazard Risk Ratings and Incident Categories, featuring customized, grid-aligned legends perfectly matching design mockups.
- **Filtering:** Global filters across the dashboard and tables allowing users to slice data by Year, Department, and custom Date Ranges.

### UI/UX & Theming
- **LU Brand Palette:** Full integration of Maroon, Amber, Cream, and Caramel as CSS variables (`src/index.css`).
- **Dark/Light Mode:** Complete theme toggle support applied consistently across the sidebar, cards, charts, and tables.
- **Responsive Layout:** Sidebar navigation with custom module accent colors and mobile-friendly collapsible menus.

### Authentication (Microsoft SSO + Preview Mode)
- Two-step flow via Microsoft Entra ID popup login is integrated using `@azure/msal-react`.
- Live mode verifies the Microsoft account with the backend and expects backend-issued JWT access and refresh tokens.
- A temporary preview mode is controlled only by `VITE_BYPASS_AUTH=true` in the local dashboard `.env` file.
- Preview mode uses a labeled `UI Preview User`, does not create a JWT, and must never be enabled in production.

---

## ⏳ Current Integration Notes

The UI is robust and connected to the live integration layer. Remaining work is limited to backend contract completion and production deployment:

- [x] **Live API clients:** Centralized API, auth, upload, dashboard, report, and token-refresh clients.
- [x] **Live module routes:** Hazards, near misses, incidents, CAPA, training, audits, inspections, and foundation data use backend endpoints.
- [x] **Backend-driven notifications:** REST notification history plus Socket.IO event updates.
- [x] **Permission-aware UI:** Menu, route, and action checks consume backend permissions when available.
- [ ] **Microsoft token contract:** The backend `POST /auth/verify-email` endpoint must issue the JWT pair and normalized user payload expected by live SSO.
- [ ] **Server report generation:** Complete backend file generation/download responses for PDF, Excel, CSV, and Word exports.
- [ ] **Production deployment:** Bundle and deploy the application through CI/CD with preview mode disabled.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS + custom LU brand CSS variables |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Auth | Microsoft Authentication Library (`@azure/msal-react`) |
| Architecture | Turborepo Monorepo (`apps/management-dashboard`, `packages/api`, `packages/auth`, `packages/ui`) |

### Frontend API Integration

The frontend API boundary is implemented in `frontend/packages/api/src`:

| Client | Responsibility |
|---|---|
| `client.ts` | Axios base URL, timeout, JWT injection, 401 refresh coordination |
| `authClient.ts` | Microsoft verification contract, login, refresh, `/auth/me`, logout |
| `uploadClient.ts` | Multipart uploads with progress reporting |
| `dashboardClient.ts` | Dashboard statistics, performance, and risk matrix APIs |
| `reportClient.ts` | Saved reports and backend export requests |
| `tokenStore.ts` | In-memory access/refresh token state; no localStorage persistence |

The management dashboard maps UI modules to backend routes as follows:

| UI Module | API Route |
|---|---|
| Hazard Reporting | `/api/v1/hazards` |
| Near Miss | `/api/v1/near-misses` |
| Incident Log | `/api/v1/incidents` |
| Action Tracker | `/api/v1/corrective-actions` |
| Training Records | `/api/v1/trainings` |
| Audit Management | `/api/v1/audits` |
| Inspection Records | `/api/v1/inspections` |

---

## 🔌 Expected Backend API Contract & Requirements (For Backend Devs)

The frontend uses the live REST API for CRUD operations. Every list request supports
server-side pagination, sorting, searching, and filtering; clients must not load an
entire transactional table for dashboard rendering.

### 1. Standard CRUD Endpoints per Module
For each module (e.g., `hazard-reporting`), the frontend's `moduleService` expects the following standard endpoints:
- `GET /api/v1/:moduleName` (Fetch all records)
- `POST /api/v1/:moduleName` (Create new record)
- `PUT /api/v1/:moduleName/:id` (Update record)
- `DELETE /api/v1/:moduleName/:id` (Delete record)

### 2. Module Database Schemas Required
Your database tables must support the exact data fields configured in the frontend schemas (`src/config/sectionSchemas.ts`). Below is the mapping of modules to expected fields:

1. **Hazard Reporting** (`/hazard-reporting`)
   - `date`, `department_id`, `originator`, `location`, `description`, `hazard_category_id`, `responsible_person`, `risk_rating_id`, `unsafe_type`, `status_id`, `remarks`
2. **Near Miss** (`/near-miss`)
   - `date`, `department_id`, `reported_by`, `designation`, `affected_person`, `affected_designation`, `time`, `location`, `details`, `preventive_action`, `responsible_person`, `investigation_required`, `reported_in_hazard`, `status_id`, `remarks`
3. **Incident Log** (`/incident-log`)
   - `date`, `description`, `shift`, `area_manager`, `gender`, `location`, `department_id`, `incident_category_id`, `root_cause_id`, `action_items`, `responsible_person`, `risk_rating_id`, `timeline`, `status_id`
4. **Actions / CAPA** (`/action-tracker`)
   - `linked_id`, `action`, `assigned_to`, `due_date`, `completion_date`, `status_id`, `remarks`
5. **Training Records** (`/training-records`)
   - `date`, `department_id`, `trainer`, `venue`, `topic`, `participants`, `duration_minutes`, `status_id` *(Note: `manhours` is computed on the frontend based on participants × duration)*
6. **Audit Management** (`/audit-management`)
   - `title`, `department_id`, `auditor`, `audit_date`, `findings`, `status_id`, `remarks`
7. **Inspection Records** (`/inspection-records`)
   - `department_id`, `inspector`, `inspection_date`, `observations`, `status_id`

### 3. Authentication & RBAC API Contract

The frontend relies on Microsoft SSO via popup, which will yield an email. It then expects to verify that email with your backend to retrieve role and scope (department) permissions.

**`POST /auth/verify-email`**
```json
// Request
{ "email": "user@example.com", "msalToken": "<microsoft_id_token>" }

// Success (200)
{
  "success": true,
  "message": "User authorized",
  "data": {
    "authorized": true,
    "user": {
      "id": "1",
      "name": "Ali Raza",
      "email": "ali@example.com",
      "roles": ["HSE Manager"],
      "permissions": ["dashboard.view", "hazards.create"],
      "department_id": "Production",
      "plant_id": "CBL-LU-SUKKUR"
    },
    "tokens": {
      "accessToken": "<jwt_access_token>",
      "refreshToken": "<jwt_refresh_token>"
    }
  }
}

// Failure (404)
{ "success": false, "message": "User not authorized" }
```

---

## 🛠️ Setup Instructions (Frontend)

1. Clone the repository.
2. Install frontend dependencies from the `frontend` workspace:
   ```bash
   cd frontend
   npm install
   ```
3. Create a `.env` file in `frontend/apps/management-dashboard/`:
   ```env
   VITE_MSAL_CLIENT_ID=your_client_id
   VITE_MSAL_TENANT_ID=your_tenant_id
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_BYPASS_AUTH=false
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173`.

> **Preview only:** Set `VITE_BYPASS_AUTH=true` to inspect the UI without Microsoft login. This uses an in-memory preview identity, does not authenticate API requests, and must be set to `false` for live integration or production.

---

<br />
<br />
<a name="backend"></a>

# 🏗️ CBL Backend API

> **Production-ready Node.js + Express + MySQL REST API** — JWT Auth, RBAC, Socket.IO, Redis, Cron Jobs, Swagger Docs, Audit Logging, and full enterprise architecture.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Fixing the "Server Not Live" Issue](#-fixing-the-server-not-live-issue)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [API Endpoints](#-api-endpoints)
- [Architecture](#-architecture)
- [Database Setup](#-database-setup)
- [Enterprise HSE SQL Schema](#enterprise-hse-sql-schema)
- [Security Features](#-security-features)
- [Default Admin Credentials](#-default-admin-credentials)
- [Testing](#-testing)
- [API Documentation (Swagger)](#-api-documentation-swagger)

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js 4 |
| Database | MySQL 8 via Sequelize ORM |
| Auth | JWT (Access + Refresh + Verify + Reset tokens) |
| Cache / Queue | Redis + BullMQ |
| Real-time | Socket.IO |
| File Storage | Local disk / AWS S3 |
| Email | Nodemailer (SMTP) / SendGrid |
| Logging | Winston + Daily Rotate File |
| Docs | Swagger / OpenAPI 3 |
| Validation | Joi |
| Security | Helmet, CORS, HPP, XSS-Clean, Rate Limiting |
| Testing | Jest + Supertest |

---

## 📁 Project Structure

```
CBL Project/
├── server.js                  # Entry point — HTTP server bootstrap
├── src/
│   ├── app.js                 # Express app setup (middleware, routes)
│   ├── api/
│   │   └── v1/
│   │       ├── controllers/   # HTTP layer: auth, user, role, notification
│   │       ├── routes/        # Route definitions with middleware chains
│   │       └── schemas/       # Joi request validation schemas
│   ├── config/
│   │   ├── index.js           # Validated env config (Joi schema)
│   │   ├── database.js        # Sequelize config (dev/test/prod)
│   │   ├── cors.js            # CORS whitelist
│   │   ├── jwt.js             # JWT helpers config
│   │   ├── mail.js            # Nodemailer transport config
│   │   ├── redis.js           # IORedis connection config
│   │   ├── storage.js         # Local/S3 storage config
│   │   └── swagger.js         # Swagger / OpenAPI spec config
│   ├── constants/             # HTTP status codes, messages
│   ├── cron/
│   │   ├── scheduler.js       # Cron job initializer
│   │   └── tokenCleanup.cron.js # Auto-expire token cleanup
│   ├── database/
│   │   ├── connection.js      # Sequelize instance
│   │   ├── migrations/        # DB migrations (5 total)
│   │   └── seeders/           # DB seeders (roles, permissions, admin)
│   ├── enums/                 # TokenType and other enums
│   ├── events/                # Async event emitter (email, audit)
│   ├── helpers/               # Shared utility helpers
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verification
│   │   ├── rbac.middleware.js        # Role-based access control
│   │   ├── rateLimiter.middleware.js # Global + auth rate limits
│   │   ├── error.middleware.js       # Global error handler
│   │   ├── audit.middleware.js       # Request audit logging
│   │   ├── sanitize.middleware.js    # XSS sanitization
│   │   ├── requestId.middleware.js   # Correlation ID injection
│   │   ├── upload.middleware.js      # Multer file upload
│   │   └── validate.middleware.js    # Joi schema validation
│   ├── models/
│   │   ├── index.js           # Sequelize model loader + associations
│   │   ├── user.model.js
│   │   ├── role.model.js
│   │   ├── permission.model.js
│   │   ├── token.model.js
│   │   ├── audit-log.model.js
│   │   └── notification.model.js
│   ├── repositories/          # Data access layer (ORM queries)
│   ├── services/
│   │   ├── auth.service.js    # Registration, login, token lifecycle
│   │   ├── user.service.js    # User management
│   │   ├── role.service.js    # Role & permission management
│   │   ├── cache.service.js   # Redis cache abstraction
│   │   ├── email.service.js   # Transactional email sending
│   │   ├── file.service.js    # File upload/storage handling
│   │   ├── audit.service.js   # Audit log writing
│   │   └── notification.service.js  # In-app notifications
│   ├── sockets/
│   │   └── index.js           # Socket.IO server (JWT auth, rooms)
│   └── utils/
│       ├── ApiResponse.js     # Standardized API response wrapper
│       ├── logger.js          # Winston logger instance
│       └── tokenGenerator.js  # JWT sign/verify helpers
├── scripts/
│   ├── migrate.js             # Programmatic migration runner
│   ├── seed.js                # Programmatic seeder runner
│   └── generateKey.js         # Secure random secret generator
├── templates/                 # Handlebars email templates
├── uploads/                   # Local file storage (gitignored)
├── storage/                   # Processed file storage
├── logs/                      # Winston log output (daily rotating)
├── tests/
│   ├── unit/                  # Unit tests (mocked repos)
│   └── integration/           # Integration tests (real DB)
├── .env                       # Local environment variables (gitignored)
├── .env.example               # Environment variable template
├── nodemon.json               # Nodemon watch config
├── jest.config.js             # Jest test config
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

Make sure these are installed and **running** on your machine:

| Requirement | Version | Check Command |
|---|---|---|
| Node.js | ≥ 18 | `node -v` |
| npm | ≥ 9 | `npm -v` |
| MySQL | 8.x | `mysql --version` |
| Redis | 7.x (optional) | `redis-cli ping` |

---

### Step 1 — Install Dependencies
```bash
npm install
```

### Step 2 — Configure Environment
```bash
cp .env.example .env
# Then edit .env with your actual values (see section below)
```

### Step 3 — Generate Secure JWT Keys
```bash
node scripts/generateKey.js
# Copy the generated secrets into your .env file
```

### Step 4 — Create MySQL Database
```sql
CREATE DATABASE cbl_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 5 — Run Migrations
```bash
npx sequelize-cli db:migrate
```

### Step 6 — Seed Initial Data (Roles, Permissions, Admin)
```bash
npx sequelize-cli db:seed:all
```

### Step 7 — Start Development Server
```bash
npm run dev
```

✅ Server starts at: `http://localhost:5000`

---

## 🔴 Fixing the "Server Not Live" Issue

The **most common reason** the server fails to start is a **MySQL connection error**.

### Root Cause (from logs)
```
❌ Failed to start server: Access denied for user 'root'@'localhost' (using password: NO)
```
This means your `.env` file has `DB_PASSWORD=` empty or wrong, OR MySQL is using a different root password.

### Fix — Step by Step

#### 1. Find your MySQL root password
Open **MySQL Workbench** or **MySQL Shell** and test:
```sql
mysql -u root -p
# Enter your password when prompted
```

#### 2. Update your `.env` file
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cbl_db
DB_USER=root
DB_PASSWORD=your_actual_mysql_root_password
```

> ⚠️ If MySQL was installed with no password, leave `DB_PASSWORD=` blank (empty).
> If MySQL was installed via XAMPP, the default password is empty.
> If MySQL was installed standalone, the installer prompted you to set a password.

#### 3. Create the database if it doesn't exist
```sql
CREATE DATABASE IF NOT EXISTS cbl_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 4. Run migrations
```bash
npx sequelize-cli db:migrate
```

#### 5. Start the server
```bash
npm run dev
```

You should see:
```
✅ MySQL connected successfully
🚀 Server running on port 5000 [development]
📖 API Docs: http://localhost:5000/api/docs
❤️  Health:  http://localhost:5000/api/health
```

---

### Other Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `Access denied for user 'root'@'localhost'` | Wrong DB password in `.env` | Update `DB_PASSWORD` in `.env` |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL not running | Start MySQL service |
| `Unknown database 'cbl_db'` | DB not created yet | Run `CREATE DATABASE cbl_db` |
| `Config validation error: "MAIL_USER" is required` | Missing env vars | Fill all required fields in `.env` |
| `ECONNREFUSED 127.0.0.1:6379` | Redis not running | Start Redis, or it is non-fatal — server still runs |
| `Port 5000 already in use` | Another process using port | Kill existing process or change `PORT` in `.env` |

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# ─── App ──────────────────────────────────────
NODE_ENV=development
PORT=5000
APP_NAME=CBL-Backend
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# ─── MySQL Database ───────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cbl_db
DB_USER=root
DB_PASSWORD=your_mysql_password_here   # ← MUST BE CORRECT

# ─── JWT Secrets (generate with: node scripts/generateKey.js) ──
JWT_ACCESS_SECRET=<min_32_chars>
JWT_REFRESH_SECRET=<min_32_chars>
JWT_VERIFY_SECRET=<min_32_chars>
JWT_RESET_SECRET=<min_32_chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_VERIFY_EXPIRY=24h
JWT_RESET_EXPIRY=1h

# ─── Redis (optional — for rate limiting, caching, queues) ────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ─── Email (SMTP) ─────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM_NAME=CBL App
MAIL_FROM_EMAIL=noreply@cblapp.com

# ─── File Storage ─────────────────────────────
STORAGE_DRIVER=local          # or 's3'
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=           # Required only if STORAGE_DRIVER=s3
# AWS_SECRET_ACCESS_KEY=       # Required only if STORAGE_DRIVER=s3
# AWS_S3_BUCKET=               # Required only if STORAGE_DRIVER=s3

# ─── Security ─────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENCRYPTION_KEY=12345678901234567890123456789012  # Exactly 32 chars

# ─── Rate Limiting ─────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# ─── Logging ──────────────────────────────────
LOG_LEVEL=info
LOG_DIR=logs
```

---

## 📋 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:coverage` | Test with coverage report |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run format` | Format with Prettier |
| `npm run generate:key` | Generate secure JWT secrets |
| `npm run migrate` | Run DB migrations programmatically |
| `npm run seed` | Run DB seeders |
| `npm run db:fresh` | Full DB reset: undo all + migrate + seed |

---

## 🌐 API Endpoints

Base URL: `http://localhost:5000/api/v1`

### 🔐 Authentication

| Method | Route | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register a new user |
| `POST` | `/auth/login` | ❌ | Login and get tokens |
| `POST` | `/auth/refresh-token` | ❌ | Refresh access token |
| `GET` | `/auth/verify-email` | ❌ | Verify email via token |
| `POST` | `/auth/forgot-password` | ❌ | Request password reset email |
| `POST` | `/auth/reset-password` | ❌ | Reset password with token |
| `POST` | `/auth/logout` | ✅ JWT | Logout (invalidate tokens) |
| `GET` | `/auth/me` | ✅ JWT | Get current user profile |

### 👤 Users

| Method | Route | Auth | Permission |
|---|---|---|---|
| `GET` | `/users` | ✅ | `user:view` |
| `GET` | `/users/:id` | ✅ | `user:view` |
| `PATCH` | `/users/:id` | ✅ | `user:update` |
| `DELETE` | `/users/:id` | ✅ | Admin only |
| `POST` | `/users/me/avatar` | ✅ | Self |

### 🎭 Roles

| Method | Route | Auth | Permission |
|---|---|---|---|
| `GET` | `/roles` | ✅ | Admin |
| `POST` | `/roles` | ✅ | Admin |
| `PATCH` | `/roles/:id` | ✅ | Admin |
| `DELETE` | `/roles/:id` | ✅ | Admin |

### 🔔 Notifications

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications` | ✅ | Get user notifications |
| `PATCH` | `/notifications/:id/read` | ✅ | Mark as read |

### 🛡️ HSE Management (Health, Safety, Environment)

| Module | Routes | Auth | Permission |
|---|---|---|---|
| **Plants** | `/plants` | ✅ | `hse:manage:plants`, `hse:view:dashboard` |
| **Departments** | `/departments` | ✅ | `hse:manage:plants`, `hse:view:dashboard` |
| **Employees** | `/employees` | ✅ | `user:manage`, `user:read` |
| **Hazards** | `/hazards` | ✅ | `hse:report:hazard`, `hse:manage:incidents` |
| **Near Misses** | `/near-misses` | ✅ | `hse:report:hazard`, `hse:manage:incidents` |
| **Incidents** | `/incidents` | ✅ | `hse:report:incident`, `hse:manage:incidents` |
| **Training** | `/trainings` | ✅ | `hse:manage:training`, `hse:view:dashboard` |
| **HSE Audits** | `/audits` | ✅ | `hse:manage:audits`, `hse:view:dashboard` |
| **Inspections** | `/inspections` | ✅ | `hse:manage:inspections`, `hse:view:dashboard` |
| **Corrective Actions** | `/corrective-actions` | ✅ | `hse:manage:incidents`, `hse:view:reports` |
| **Attachments** | `/attachments` | ✅ | `hse:view:dashboard`, `hse:manage:incidents` |
| **Dashboard** | `/dashboard/stats` | ✅ | `hse:view:dashboard` |
| **Reports** | `/reports/performance` | ✅ | `hse:view:reports` |

### 🩺 Health & Docs

| Route | Description |
|---|---|
| `GET /api/health` | Server health check (uptime, env, timestamp) |
| `GET /api/docs` | Swagger UI interactive documentation |

---

## 🏗️ Architecture

### Request Lifecycle
```
HTTP Request
  → RequestId Middleware   (correlation ID injected)
  → Security Middleware    (Helmet, CORS, HPP, XSS)
  → Rate Limiter           (global + auth-specific)
  → Route Match
      → Joi Validation     (request body/params/query)
      → Auth Middleware    (JWT verify)
      → RBAC Middleware    (permission check)
      → Controller         (HTTP in/out only)
          → Service        (business logic)
              → Repository (SQL via Sequelize)
                  → MySQL
          → Events         (async: email, audit log)
  → Response
  → Error Middleware       (global catch)
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Controllers** | Parse HTTP request, call service, send response |
| **Services** | Business logic, orchestration, transaction coordination |
| **Repositories** | ORM queries, data access only |
| **Middleware** | Cross-cutting: auth, validation, rate limit, logging |
| **Events** | Async side effects (email sending, audit logs) |
| **Models** | Sequelize model definitions + associations |
| **Config** | Validated, typed environment configuration |

---

## 🗄️ Database Setup

### Migrations (5 files)

| File | Creates |
|---|---|
| `20240101000001-create-users.js` | `users` table |
| `20240101000002-create-roles.js` | `roles` table |
| `20240101000003-create-permissions.js` | `permissions` + `role_permissions` tables |
| `20240101000004-create-tokens.js` | `tokens` table (JWT blacklist/refresh) |
| `20240101000005-create-audit-notifications.js` | `audit_logs` + `notifications` tables |

### Seeders (3 files)

| File | Seeds |
|---|---|
| `01-roles.seeder.js` | Default roles: `superadmin`, `admin`, `user` |
| `02-permissions.seeder.js` | All CRUD permissions per resource |
| `03-admin-user.seeder.js` | Default superadmin user |

### Run migrations + seeds
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### Reset database
```bash
npm run db:fresh
```

## Enterprise HSE SQL Schema

The repository also contains the production-oriented MySQL 8 schema for the CBL
LU Sukkur Plant HSE Management System in [`database/schema`](database/schema).
The scripts are organized by module and are designed to be executed in numeric
order after the `cbl_hse` database and prerequisite tables exist.

### Schema Modules

| Sequence | Module | Scope |
|---|---|---|
| `01-20` | HSE foundation and hazard management | Plants, departments, locations, employees, RBAC, hazards, attachments, actions, reviews, history, and notifications |
| `21-28` | Near miss management | Near miss reporting, investigations, RCA, reviews, status history, notifications, and corrective actions |
| `29-41` | Incident and accident management | Incident categories, incidents, investigations, RCA, CAPA, reviews, witnesses, injury, environmental, and property damage records |
| `42-53` | Training and competency | Training types, trainers, sessions, attendance, manhours, certifications, TNA, competencies, feedback, documents, notifications, and history |
| `54-67` | Audit and inspection management | Audits, inspection types, inspections, checklists, findings, non-conformities, compliance, documents, notifications, and history |
| `68-77` | Training Management extension | Normalized topics, providers, training transactions, history, TNA, documents, notifications, and dashboard views |
| `78-87` | Audit and Inspection extension | Isolated audit/inspection masters, transactions, findings, inspection results, compliance tracking, and dashboard views |
| `88-97` | Document Management and SOP control | Controlled documents, document types, versions, immutable change history, approvals, circulation, folders, notifications, and dashboard views |
| `98-107` | Reporting, Analytics, KPI, and Dashboard | Configurable widgets, layouts, saved reports, schedules, exports, KPI definitions, targets, snapshots, risk heat maps, and reporting views |

### Reporting Module Files

The Reporting, Analytics, KPI & Dashboard module uses the `ra_` namespace to
avoid collisions with earlier schema phases. The requested sequence `71-80`
was already occupied by existing training scripts, so the new module uses the
next available sequence without modifying those files.

| File | Purpose |
|---|---|
| `98_dashboard_widgets.sql` | 30 configurable KPI, chart, table, gauge, and heat-map widgets |
| `99_dashboard_layouts.sql` | Per-user dashboard layouts and widget placement |
| `100_saved_reports.sql` | Saved reports, filters, chart types, formats, and visibility |
| `101_report_schedules.sql` | Scheduled report generation and normalized recipients |
| `102_report_exports.sql` | PDF, Excel, and CSV export history |
| `103_kpi_definitions.sql` | 50 leading, lagging, operational, and executive KPI definitions |
| `104_kpi_targets.sql` | Plant and period-specific KPI targets and thresholds |
| `105_analytics_snapshots.sql` | Daily pre-calculated analytics snapshots |
| `106_risk_matrix_data.sql` | Materialized 5x5 probability/severity heat-map data |
| `107_reporting_views.sql` | 20 read-only executive, management, trend, risk, and drill-down views |

### Schema Execution

```sql
CREATE DATABASE IF NOT EXISTS cbl_hse
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cbl_hse;

SOURCE database/schema/01_plants.sql;
-- Continue through database/schema/107_reporting_views.sql in numeric order.
```

The schema uses InnoDB, foreign keys, soft-delete columns where appropriate,
audit columns on transactional tables, indexed reporting dimensions, and
restrictive delete rules for audit retention. Existing legacy parent tables use
their established identifiers; new reporting tables use BIGINT UNSIGNED
surrogate keys and do not recreate existing business tables.

---

## 🔐 Default Admin Credentials

After running seeders:

| Field | Value |
|---|---|
| Email | `superadmin@cblapp.com` |
| Password | `Admin@123!` |

> ⚠️ **Change these immediately in production!**

---

## 🛡️ Security Features

| Feature | Implementation |
|---|---|
| JWT Access + Refresh Tokens | Short-lived access (15m), long-lived refresh (7d) |
| Password Hashing | bcrypt (12 rounds) |
| Rate Limiting | Global (100 req/15min) + Auth (10 req/15min) |
| Security Headers | Helmet.js |
| CORS Whitelist | Configurable `ALLOWED_ORIGINS` |
| XSS Sanitization | `xss-clean` middleware |
| HTTP Parameter Pollution | `hpp` middleware |
| SQL Injection Prevention | Sequelize parameterized queries |
| Soft Deletes | Sequelize `paranoid: true` (`deletedAt`) |
| Audit Logging | Every write action logged with user + IP |
| Request Correlation IDs | UUID per request for log tracing |
| Token Blacklisting | Refresh tokens stored + invalidated on logout |

---

## 🧪 Testing

```bash
# All tests
npm test

# Unit tests (mocked repositories — no DB required)
npm run test:unit

# Integration tests (requires running MySQL test DB)
npm run test:integration

# Coverage report
npm run test:coverage
```

Tests are located in `tests/unit/` and `tests/integration/`.

---

## 📖 API Documentation (Swagger)

Interactive Swagger UI is available at:

```
http://localhost:5000/api/docs
```

The spec is auto-generated from JSDoc annotations across all route files using `swagger-jsdoc`.

---

## 🔌 Real-time (Socket.IO)

WebSocket server is initialized at `ws://localhost:5000/socket.io`.

**Authentication:** Pass a valid JWT access token in the handshake:
```js
const socket = io('http://localhost:5000', {
  auth: { token: 'your_access_token' }
});
```

Users are automatically joined to their personal room: `user:{userId}` for targeted notifications.

---

## 📬 Email

Emails are sent via Nodemailer using SMTP (configured via `MAIL_*` env vars).

For Gmail: enable **2-Factor Authentication** and create an **App Password**:
1. Go to Google Account → Security → App Passwords
2. Generate a password for "Mail"
3. Use that as `MAIL_PASSWORD` in `.env`

---

## 🕐 Cron Jobs

| Job | Schedule | Description |
|---|---|---|
| Token Cleanup | Daily | Remove expired tokens from DB |

Cron jobs are initialized at server startup via `src/cron/scheduler.js`.

---

## 🚀 Production Deployment Checklist

- [ ] Set `NODE_ENV=production` in environment
- [ ] Use strong, randomly generated JWT secrets (`node scripts/generateKey.js`)
- [ ] Set real `DB_PASSWORD` (not default)
- [ ] Configure real SMTP credentials
- [ ] Set `ALLOWED_ORIGINS` to your actual frontend domain
- [ ] Enable SSL for MySQL (`dialectOptions.ssl`)
- [ ] Run migrations: `npx sequelize-cli db:migrate`
- [ ] Run seeders once: `npx sequelize-cli db:seed:all`
- [ ] Use a process manager: `pm2 start server.js --name cbl-api`
- [ ] Set up log rotation (already configured with winston-daily-rotate-file)
- [ ] Change default admin password immediately after first login

---

*Last updated: 2026-08-03*
