# 🛡️ Kristallball - Enterprise Military Asset Management System

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-black.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-cyan.svg?logo=react&logoColor=white)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIL--SPEC-emerald.svg)]()

> An enterprise-grade Defense Logistics & Asset Reconciliation System engineered to track mission-critical military equipment (weapons, armored vehicles, munitions) across multiple tactical commands with strict Role-Based Access Control (RBAC), ACID-compliant atomic transactions, and automated audit logging.

---

## 🎯 Executive Summary & Core Capabilities

The **Kristallball Military Asset Management System** solves complex defense logistics challenges across multi-echelon commands:

1. **End-to-End Asset Visibility:** Real-time reconciliation of inventory balances without stale duplicates using dynamic relational calculus.
2. **Operational Accountability:** Cross-base transfers executed with atomic database transactions (`BEGIN...COMMIT / ROLLBACK`), ensuring equipment cannot vanish in transit.
3. **Granular Role-Based Access Control (RBAC):** Strict isolation ensuring Base Commanders only view and mutate their assigned base armories, Logistics Officers handle supply inflows and transfers, and HQ Admins retain global command oversight.
4. **Comprehensive Central Audit Trail:** Automated interception and immutable logging of every asset mutation (purchase, transfer, status update, personnel allocation, expenditure) with user attribution and IP tracking.

---

## 📐 Mathematical Reconciliation Model

Inventory counts across any command theater or time window strictly obey:

$$\text{Closing Balance} = \text{Opening Balance} + \text{Net Movement} - \text{Assigned} - \text{Expended}$$

$$\text{Net Movement} = \text{Purchases} + \text{Transfers In} - \text{Transfers Out}$$

* **Opening Balance:** Baseline inventory stock established in `initial_balances`.
* **Purchases (+):** Inflow from defense contractors and arsenal procurement.
* **Transfers In (+):** Inbound completed transfers received from other tactical bases.
* **Transfers Out (-):** Outbound completed transfers dispatched to other bases.
* **Assigned (-):** Equipment actively issued to soldiers, platoons, and combat units.
* **Expended (-):** Munitions consumed in live-fire exercises, combat operations, or maintenance decommissioning.
* **Closing Balance:** Verified on-hand available stock.

---

## 🏗️ System Architecture

```
                                  +-----------------------------+
                                  |   Vite React SPA Frontend   |
                                  | (Tailwind CSS, Lucide, Recharts)
                                  +--------------+--------------+
                                                 |
                                     JWT Bearer / REST JSON
                                                 |
                                                 v
                                  +-----------------------------+
                                  |     Express.js API Engine   |
                                  |   - Helmet & CORS Security  |
                                  |   - JWT Authentication      |
                                  |   - RBAC Base Scope Filter  |
                                  |   - Audit Logging Engine    |
                                  +--------------+--------------+
                                                 |
                                       pg Connection Pooling
                                                 |
                                                 v
                     +-------------------------------------------------------+
                     |             PostgreSQL Relational Database            |
                     |  - Strict Foreign Key Constraints & ACID Compliance   |
                     |  - Atomic Transfers (BEGIN ... COMMIT / ROLLBACK)     |
                     |  - Real-Time Dynamic Balance Aggregation CTEs         |
                     +-------------------------------------------------------+
```

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Feature / Endpoint | HQ Admin | Base Commander | Logistics Officer |
| :--- | :---: | :---: | :---: |
| **Theater-Wide Oversight (All Bases)** | ✅ Global | ❌ Scoped to Own Base | ✅ Global Supply |
| **View Dashboard Metrics** | ✅ All Bases | ✅ Scoped to Assigned Base | ✅ All Bases |
| **Log Purchases (Procurement)** | ✅ Global | ✅ Assigned Base Only | ✅ Global Operations |
| **Dispatch Asset Transfers** | ✅ Any Base to Any Base | ✅ Outbound from Assigned Base Only | ✅ Any Base to Any Base |
| **Update Transfer Status** | ✅ Full Control | ✅ Destination Base Receipt | ✅ Full Control |
| **Assign Assets to Personnel** | ✅ All Bases | ✅ Assigned Base Only | ❌ Read Only |
| **Log Expended Munitions** | ✅ All Bases | ✅ Assigned Base Only | ✅ Read Only |
| **View Central Audit Logs** | ✅ Global Trail | ✅ Scoped to Assigned Base | ❌ Restricted |

---

## 🔑 Sample Test Credentials

Use these credentials to test role switching and data scoping:

| Role | Username | Password | Base Assignment | Scope Description |
| :--- | :--- | :--- | :--- | :--- |
| **HQ Admin** | `admin_user` | `AdminPass123!` | All Bases (Global) | Unrestricted global control across Fort Alpha, Fort Bravo, Naval Echo, FOB Zulu. |
| **Base Commander (Alpha)** | `commander_alpha` | `CommandPass123!` | Fort Alpha (Base #1) | Locked to Fort Alpha. Cannot see or transfer assets from other bases. |
| **Base Commander (Bravo)** | `commander_bravo` | `CommandPass123!` | Fort Bravo (Base #2) | Locked to Fort Bravo. Exercises armory control over Base #2. |
| **Logistics Officer** | `logistics_officer` | `LogisticsPass123!` | Base #1 / Global Ops | Supply chain management, cross-base convoy dispatching, procurement logging. |

> 💡 *Enter any of the test credentials above into the secure login screen to test role-based views and permissions.*

---

## 📁 Project Directory Structure

```
military-asset-management/
├── backend/
│   ├── config/
│   │   └── db.js                 # PostgreSQL connection pool with transaction helper
│   ├── controllers/
│   │   ├── authController.js     # User login & session profile
│   │   ├── assetController.js    # Dynamic inventory reconciliation CTE queries
│   │   ├── purchaseController.js # Procurement logging with audit trail
│   │   ├── transferController.js # Atomic cross-base DB transactions (BEGIN/COMMIT)
│   │   ├── assignmentController.js # Personnel assignment & ammunition expenditure
│   │   ├── auditController.js    # Immutable central audit trail query engine
│   │   └── metaController.js     # Base and equipment metadata providers
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT extraction and verification
│   │   ├── rbacMiddleware.js     # Role checks & automatic base-scope injector
│   │   └── loggerMiddleware.js   # Automated API audit logging
│   ├── models/
│   │   ├── schema.sql            # Relational DDL schema with indexes and constraints
│   │   └── seed.sql              # Realistic military theater seed data
│   ├── routes/                   # Modular Express routers
│   ├── scripts/
│   │   ├── initDb.js             # DDL execution script
│   │   ├── seedDb.js             # Seed execution script
│   │   └── testEndpoints.js      # Automated backend API test suite
│   ├── .env.example              # Environment variables template
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Express server bootstrap
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Top tactical header with role badge & status
│   │   │   ├── Sidebar.jsx       # RBAC-driven command menu
│   │   │   ├── StatCard.jsx      # Reusable military HUD metric card
│   │   │   └── NetMoveModal.jsx  # Interactive Net Movement breakdown pop-up
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Tactical dashboard with charts & visibility matrix
│   │   │   ├── Purchases.jsx     # Procurement logging & historical archive
│   │   │   ├── Transfers.jsx     # Cross-base transfer dispatch & convoy tracking
│   │   │   ├── Assignments.jsx   # Personnel allocation & expended ammunition tabs
│   │   │   ├── AuditLogs.jsx     # Central security & mutation audit trail
│   │   │   └── Login.jsx         # Command authentication portal with secure credentials
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT request/response interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global user state management & role utilities
│   │   ├── App.jsx               # React Router configuration with Protected Routes
│   │   └── main.jsx
│   ├── tailwind.config.js        # Tactical color scheme configuration
│   └── vite.config.js            # Vite configuration with API proxy
├── dump.sql                      # Consolidated schema and seed data dump
├── schema.sql                    # Pure relational schema definition
├── DOCUMENTATION.md              # Comprehensive enterprise report for PDF export
└── package.json                  # Root convenience scripts
```

---

## 🚀 Quickstart Guide (Local Setup)

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: v14+ running locally (or remote Neon / Supabase instance)

### 2. Database Initialization
Create the database and execute the schema:
```bash
# Using PostgreSQL CLI
psql -U postgres -c "CREATE DATABASE military_assets;"
psql -U postgres -d military_assets -f backend/models/schema.sql
psql -U postgres -d military_assets -f backend/models/seed.sql
```
*Or using automated npm scripts:*
```bash
npm run db:init
npm run db:seed
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
npm start
```
*Backend server runs at `http://localhost:5000`.*

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

### 5. Automated Verification Test Suite
Run the built-in end-to-end API test suite:
```bash
npm run test
```
*Verifies /health, Admin login, Base Commander login, automatic Base Scoping calculations, Purchase list, Transfers list, and RBAC 403 authorization denials.*

---

## 🌐 Cloud Deployment Architecture

### Backend & Database (Render / Railway)
1. Provision a managed **PostgreSQL** database instance on Render, Railway, Neon, or Supabase.
2. In the backend environment variables, configure:
   - `DATABASE_URL`: `postgresql://<user>:<password>@<host>:<port>/<dbname>`
   - `JWT_SECRET`: High-entropy secret key
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
3. Execute `npm run db:init` and `npm run db:seed` against the remote database.
4. Deploy the backend service from the `/backend` subdirectory with start command `npm start`.

### Frontend SPA (Vercel / Netlify)
1. Link your repository to **Vercel** or **Netlify**.
2. Set Root Directory to `frontend`.
3. Configure environment variable:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com/api`
4. Build command: `npm run build`
5. Output directory: `dist`

---

## 📄 License
Internal Defense Systems Specification — Developed for Military Asset Management System.
