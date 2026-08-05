# System Design Document
## CBL LU Sukkur Plant — HSE Management System

### 1. Overview
The CBL LU Sukkur Plant HSE (Health, Safety, and Environment) Management System is a comprehensive, end-to-end full stack enterprise application designed to digitize manual records, track incident closures, manage audits/inspections, and enforce accountability through an automated Action Tracker (CAPA).

### 2. Architecture
The system follows a modern client-server architecture with a monolithic RESTful backend and a unified, highly modular frontend dashboard.

#### Frontend Architecture
- **Framework**: React 18/19 with Vite.
- **State Management**: Zustand (for auth and global state) and React Context (e.g., `FilterContext`).
- **Styling**: Tailwind CSS configured with the official LU brand palette (Maroon, Amber, Cream, Caramel) and full Dark/Light mode support.
- **Authentication**: Microsoft Entra ID (SSO) using `@azure/msal-react`, which securely exchanges verification with the backend to receive JWTs.
- **Monorepo Setup**: Built using Turborepo + npm workspaces (`apps/management-dashboard`, `packages/auth`, `packages/ui`, `packages/api`).
- **API Communication**: 
  - **REST**: Axios with a centralized API client (`apiClient`) featuring JWT request interception, token refresh mechanisms, and error handling.
  - **Real-Time**: `socket.io-client` for live, bidirectional updates (e.g., triggering `dashboard-refresh` or receiving `notification.created` events).
- **Components & Charts**: Config-driven dynamic tables (`DataEntrySection`) and visualizations using `recharts`.

#### Backend Architecture
- **Runtime & Framework**: Node.js (≥18) with Express.js 4.
- **Database Layer**: MySQL 8 accessed via Sequelize ORM.
- **Authentication & Authorization**: 
  - JWT for stateless session management (Access, Refresh, Verify, Reset tokens).
  - RBAC (Role-Based Access Control) middleware enforcing endpoint security (`superadmin`, `admin`, `user`).
- **Real-time Engine**: Socket.IO for pushing live notifications to connected users in their respective rooms (`user:{userId}`).
- **Background Jobs & Cache**: Redis + BullMQ for asynchronous task queues and caching.
- **Security**: Helmet.js, CORS, HPP, XSS-Clean, and Global/Auth Rate Limiting.
- **Logging & Auditing**: Winston logger and comprehensive Database Audit Trails (using `auditLog` middleware to log every write action).

### 3. Database Schema
The database (`cbl_hse`) is driven by over 100 enterprise SQL schema files logically organized by modules. Key segments include:
- **01-20**: HSE Foundation & Hazard Management (Plants, Departments, Hazards, Actions)
- **21-28**: Near Miss Management (Reporting, Investigations, RCA)
- **29-41**: Incident & Accident Management (Categories, RCA, CAPA, Witnesses, Damages)
- **42-53 & 68-77**: Training & Competency Management (Trainers, Sessions, Manhours, TNA)
- **54-67 & 78-87**: Audit & Inspection Management (Checklists, Findings, Non-conformities)
- **88-97**: Document Management and SOP Control (Versions, Approvals, Circulation)
- **98-107**: Reporting, Analytics, KPI & Dashboards (Widgets, Targets, Snapshots, Risk Matrix)

### 4. Key Modules & Business Logic
- **Hazard Reporting**: Tracks unsafe acts, conditions, and environments with risk ratings and status lifecycles.
- **Near Misses**: Captures near-miss events and determines if further formal investigation is required.
- **Incident Log**: Records fatalities, LTIs (Lost Time Injuries), RWCs (Restricted Work Cases), First Aids, and Fire Incidents, enforcing Root Cause Analysis (RCA) and closing out via CAPA.
- **CAPA (Action Tracker)**: The central accountability hub. Links corrective and preventive actions to their source incidents/hazards with strict due dates and assigned personnel.
- **Training Records**: Logs training sessions and automatically computes total manhours (Participants × Duration).
- **Audits & Inspections**: Manages scheduled HSE checks and resultant non-conformities via segmented workflows.

### 5. Integration Points & Lifecycle
- **RESTful API**: The frontend consumes standard CRUD operations for all entities via `/api/v1/:moduleName`. 
- **Request Lifecycle**: `HTTP Request` → `Security/Rate-Limiting Middleware` → `Joi Validation` → `Auth/RBAC Middleware` → `Controller` → `Service` → `Sequelize (MySQL)` → `Async Events (Audit/Socket)`.
- **WebSocket (Socket.IO)**: Used for instantaneous updates in the UI (Toast alerts, notification panels, and dashboard live-reloading) without the need for client-side HTTP polling.
- **Email (SMTP)**: Nodemailer/SendGrid used for dispatching transactional emails for alerts and password resets asynchronously via the event emitter.
