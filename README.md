# 🏪 Street Vendor Management System (SVMS)

A community-focused web platform that connects **street vendors** with **local customers** and provides an **administrator console** for vendor verification, stall status management, and directory moderation. Built with a clean **Vanilla HTML/CSS/JavaScript** frontend and a **Node.js + Express 5 + MongoDB** backend using the native driver.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) | No frontend frameworks (no React, Angular, or Vue). Native DOM manipulation, Fetch API, Flexbox/Grid responsive layout. |
| **Backend** | Node.js (v20.19.0+) & Express 5 (`^5.2.1`) | RESTful JSON API with modular route handlers, input validation, and role-based middleware. |
| **Database** | MongoDB Atlas via Native Driver (`mongodb ^7.5.0`) | Direct MongoDB operations using native driver (no Mongoose). Compound unique indexes for deduplication. |
| **Security & Auth** | JWT (`jsonwebtoken`) + Node.js Native `crypto.scrypt` | Signed JSON Web Tokens with 2-hour expiry, `crypto.scrypt` password hashing with 16-byte random salt, and constant-time `timingSafeEqual` password verification. |
| **Client Session** | Browser `localStorage` | Role-isolated session storage keys preventing cross-role session overwrite or accidental clearance. |

---

## ✨ Implemented Features

### 👤 Customer Features
- **Registration**: Self-service registration with unique ID auto-generation (`CUS-XXXX`), 10-digit Indian mobile format validation, valid email check, and password confirmation.
- **Authentication**: Customer ID + password login, JWT generation, and role-isolated session storage.
- **Personalized Dashboard**: Dynamic welcome greeting with customer name, header avatar initial, and registered profile card (Customer ID, Name, Email, and Mobile Number).
- **Verified Vendor Discovery**: Inline catalog browsing approved street vendors with real-time text search, category filtering, district filtering, and a dedicated **Clear filters** button.
- **Vendor Reviews History**: Accessible modal displaying existing customer ratings, star breakdown, and review comments for any selected stall without browser `alert()` popups.
- **Rate & Review Submission**: Interactive review modal with 1–5 star rating selector, text validation, inline polite status announcements, and per-customer rate limiting (max 15 reviews per 15 minutes).
- **Session Isolation**: Logging out purges customer session keys while preserving independent vendor or admin sessions in multi-role browser environments.

### 🧑‍💼 Vendor Features
- **Registration**: Vendor onboarding generating a unique `VND-XXXX` identifier, owner name, business name, category, district, operating address, experience years, description, and initial status set to **Pending**.
- **Authentication**: Vendor login with Vendor ID and password, issuing role-verified JWT tokens.
- **Portal Dashboard**:
  - Live verification status indicator (**Pending**, **Verified**, or **Rejected**).
  - Operating schedule management: interactive checkbox selection for active days (Monday through Sunday).
  - Product catalog management: add and manage product item names and descriptions.
- **Protected Status**: Vendors cannot approve themselves or alter their verification status; status updates are strictly restricted to the administrator.
- **Digital Payment Guide (`vendor/payment.html`)**: Educational reference module explaining UPI adoption, QR code placement, and digital transaction best practices for micro-merchants.
- **Government Schemes Guide (`vendor/schemes.html`)**: Informational resource detailing central government welfare initiatives including **PM SVANidhi** micro-credit loans, eligibility criteria, and application steps.

### 🛡️ Administrator Features
- **Secure Admin Authentication**: Login protected by server-side verification using `crypto.scrypt` against the configured `ADMIN_PASSWORD_HASH` and rate-limited against brute-force attempts.
- **Overview Metrics**: Real-time counter cards showing Total Registered Vendors, Pending Applications, Verified Stalls, and Rejected Applications.
- **Vendor Applications Table**: 8-column aligned responsive table:
  1. `Vendor ID`
  2. `Owner Name`
  3. `Business Name`
  4. `Category`
  5. `District`
  6. `Registered Date` (formatted readable date with fallback)
  7. `Status` (pill badge)
  8. `Actions` (Approve / Reject controls)
- **Search & Pagination**: Live keyword search across stall names and owner names that automatically resets pagination to Page 1 on input change, with previous/next page navigation controls.
- **Filter Controls**: Status dropdown filter (All, Pending, Verified, Rejected) synchronized with sidebar shortcut filters.
- **Verification Workflow**: One-click **Approve** (marks vendor `Verified`) and **Reject** buttons with immediate MongoDB persistence and live table refresh.
- **Defensive Security & XSS Protection**: Dynamic vendor text fields bound via `textContent` rather than raw HTML interpolation to eliminate script injection.
- **Access Guard**: Visiting the admin console without valid admin credentials redirects the user to the home page with an alert while preserving any active customer or vendor sessions.

### 🌐 Public Vendor Directory (`directory/vendors.html`)
- Standalone public directory listing only **Verified** street vendors.
- Keyword search, category dropdown, and district filtering.
- Stall cards displaying owner name, business category, district, and operating details.
- Modal dialogs for viewing reviews and submitting customer ratings.
- **Privacy Protection**: Public API projections explicitly exclude private vendor email addresses and password hashes.

---

## 📡 Backend API Endpoints

All protected endpoints require an `Authorization: Bearer <token>` header with role verification handled by `authenticateToken` and `authorizeRole(...)`.

| Method | Endpoint | Allowed Role | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Server health check |
| `POST` | `/api/admin/login` | Public (Rate-limited) | Authenticates admin using `ADMIN_PASSWORD_HASH` |
| `GET` | `/api/admin/vendors` | Admin only | Returns all vendor applications for administrative review |
| `PUT` | `/api/admin/vendors/:id/status` | Admin only | Approves (`Verified`) or rejects vendor application |
| `POST` | `/api/vendors` | Public (Rate-limited) | Registers vendor, creates `VND-XXXX`, hashes password |
| `POST` | `/api/vendors/login` | Public (Rate-limited) | Authenticates vendor with ID + password |
| `GET` | `/api/vendors/:id` | Vendor only | Retrieves vendor's own profile and shop details |
| `PUT` | `/api/vendors/:id` | Vendor only | Updates vendor's own profile fields (cannot change status) |
| `PUT` | `/api/vendors/:id/shop-details`| Vendor only | Updates operating days and product catalog |
| `GET` | `/api/public/vendors` | Public | Returns public list of verified vendors (`email` & `password` excluded) |
| `GET` | `/api/public/vendors/:id` | Public | Returns single verified vendor with aggregated rating |
| `POST` | `/api/customers` | Public (Rate-limited) | Registers customer, creates `CUS-XXXX`, hashes password |
| `POST` | `/api/customers/login` | Public (Rate-limited) | Authenticates customer with ID + password |
| `GET` | `/api/customers/:id` | Customer only | Retrieves customer's own profile data |
| `POST` | `/api/reviews` | Customer only (Rate-limited)| Submits or updates vendor review (1 review per customer per stall) |
| `GET` | `/api/reviews/vendor/:vendorId`| Public | Returns public review list and average rating for a vendor |
| `GET` | `/api/vendors` | Public (Legacy) | Legacy alias returning verified vendors |

---

## 🗄️ Database Schema & Indexes (MongoDB `streetVendorDB`)

The application interacts directly with three core collections via native MongoDB driver queries:

1. **`vendors`**:
   - Fields: `id` (`VND-XXXX`), `name`, `mobile`, `email`, `businessName`, `category`, `district`, `address`, `years`, `description`, `status` (`Pending` \| `Verified` \| `Rejected`), `password` (scrypt hash), `days`, `products`, `createdAt`.
   - Indexes: Unique on `id`, unique on `email`, unique on `mobile`.
2. **`customers`**:
   - Fields: `id` (`CUS-XXXX`), `name`, `mobile`, `email`, `password` (scrypt hash), `createdAt`.
   - Indexes: Unique on `id`, unique on `email`, unique on `mobile`.
3. **`reviews`**:
   - Fields: `customerId`, `customerName`, `vendorId`, `rating` (1–5), `review`, `createdAt`, `updatedAt`.
   - Indexes: Compound index on `{ vendorId: 1, createdAt: -1 }`, and compound unique index on `{ customerId: 1, vendorId: 1 }` (enforcing one review per customer per vendor).

---

## 🔐 Security Architecture

- **Cryptographic Password Hashing**: Passwords are never stored in plaintext. Uses Node.js native `crypto.scrypt` with a cryptographically secure 16-byte random salt and 64-byte key length. Password verification uses `crypto.timingSafeEqual` to prevent timing analysis attacks.
- **Role-Based Access Control (RBAC)**: Signed JWT tokens with 2-hour validity. Every protected backend endpoint verifies both signature and role (`admin`, `vendor`, `customer`). Unauthorized access returns HTTP 401 or 403.
- **Session Isolation**: Client storage manages authentication using role-specific keys (`adminToken`, `vendorToken`, `customerToken`) alongside standard keys. Actions in one role do not overwrite or wipe sessions of another role.
- **Data Privacy**: Public vendor listings project `{ password: 0, email: 0 }` to prevent personal contact scraping.
- **Cross-Site Scripting (XSS) Mitigation**: Dynamic user inputs (vendor names, categories, districts, review comments) are bound via DOM `textContent` or escaped before rendering.
- **Rate Limiting**: Built-in in-memory rate limiters protect registration (5 requests / 15 min), login (10 attempts / 15 min), and review submissions (15 submissions / 15 min).

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- **Node.js**: Version 20.19.0 or later (required by MongoDB Node.js driver 7.5.0; tested on Node 20–24).
- **MongoDB**: A free MongoDB Atlas cluster connection URI (or local MongoDB on port 27017).
- A local web server for static files (e.g. VS Code **Live Server** extension or `npx serve`).

### 2. Install Backend Dependencies
Open your terminal in the `backend/` directory:
```bash
cd backend
npm install
```

### 3. Generate Admin Password Hash
The administrator password is not stored in plaintext. Generate a secure `scrypt` hash using the included helper script:
```bash
node generate-password-hash.js yourAdminPasswordHere
# or
npm run hash-password yourAdminPasswordHere
```
This prints a hash formatted as `<salt>:<derivedKeyHex>` (e.g. `a1b2c3d4...:e5f6g7h8...`). Copy this value.

### 4. Configure Environment Variables
Create a file named `.env` in the `backend/` folder (you can copy `.env.example` as a template):
```env
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/streetVendorDB?retryWrites=true&w=majority
JWT_SECRET=your-random-jwt-secret-key-at-least-32-chars
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=paste-the-generated-scrypt-hash-here
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```
> ⚠️ **Important**: Never commit `backend/.env` to Git. It is already included in `.gitignore`.

### 5. Start the Backend Server
From the `backend/` directory:
```bash
npm start
```
The terminal will display:
```
MongoDB connected successfully!
Server running on http://localhost:5000
```

### 6. Serve the Frontend
The backend operates strictly as a REST API and does not serve static HTML files. Serve the project files using Live Server:
- In VS Code, right-click `index.html` and select **"Open with Live Server"**.
- The frontend will open in your browser at `http://127.0.0.1:5500/index.html`.
- [`js/config.js`](js/config.js) automatically points API requests to `http://localhost:5000/api` when running on `localhost` or `127.0.0.1`.

---

## 📁 Repository Structure

```
Street-Vendor-Management-System/
├── index.html                   # Main landing page & role navigation
├── css/
│   └── style.css                # Global styles, shared sidebar, and dashboard themes
├── js/
│   ├── config.js                # API base URL configuration
│   ├── customer.js              # Customer auth, profile, inline catalog, review modal
│   ├── vendor.js                # Vendor auth, dashboard, operating days, directory view
│   ├── admin.js                 # Admin auth guard, vendor table, status approve/reject
│   ├── sidebar.js               # Responsive mobile header, collapse toggle & active links
│   └── directory.js             # Legacy directory script (superseded by vendor.js)
├── customer/
│   ├── login.html               # Customer login portal
│   ├── register.html            # Customer registration portal
│   └── dashboard.html           # Customer dashboard with inline vendor directory
├── vendor/
│   ├── login.html               # Vendor login portal
│   ├── register.html            # Vendor registration portal
│   ├── dashboard.html           # Vendor portal (products, schedule, status)
│   ├── payment.html             # Digital payments guide for street vendors
│   └── schemes.html             # Government welfare schemes guide (PM SVANidhi)
├── directory/
│   └── vendors.html             # Standalone public vendor directory
├── admin/
│   ├── login.html               # Admin login portal
│   └── dashboard.html           # Admin console (metrics, vendor review table)
├── img/
│   ├── logo.png                 # System brand logo
│   └── vendor.jpeg              # Hero section street market image
└── backend/
    ├── server.js                # Express app, scrypt auth, MongoDB collections, API routes
    ├── generate-password-hash.js# CLI tool for generating scrypt admin password hashes
    ├── package.json             # Backend dependencies (express, mongodb, jsonwebtoken)
    ├── .env.example             # Example environment variable template
    └── .gitignore               # Ignores node_modules and .env
```

---

## 🧪 Verification & Automated Testing

The codebase includes an extensive suite of regression test scripts in `scratch/`:
- **`scratch/test_admin_module.js`**: Validates admin login, RBAC on `/api/admin/vendors`, and approve/reject status changes.
- **`scratch/test_admin_session_isolation.js`**: Verifies that unauthorized visits to admin pages do not wipe customer/vendor sessions, plus backend 401/403 guards.
- **`scratch/test_admin_xss_prevention.js`**: 52 assertions testing HTML escaping and DOM `textContent` binding.
- **`scratch/test_admin_table_alignment.js`**: Verifies 8-column table headers, date formatting, and `colspan="8"` states.
- **`scratch/test_admin_mobile_labels.js`**: Confirms responsive `data-label` attributes on every table row cell.
- **`scratch/test_admin_search_pagination.js`**: Tests search input resetting `currentPage = 1` and boundary navigation.
- **`scratch/test_priority1_fixes.js`**: Tests customer/vendor session isolation and review rate limiting.
- **`scratch/test_vendor_payment_schemes_fixes.js`**: Tests vendor payment and schemes layout and CSS hierarchy.

> **Database Safety**: Automated backend tests run exclusively against an ephemeral test database (`streetVendorDB_test` on port `5098`). Tests never execute write operations against production databases.

To run any test suite:
```bash
node scratch/test_admin_search_pagination.js
node scratch/test_admin_session_isolation.js
```

---

## 🔮 Future Enhancements (Phase 2 Scope)

The following capabilities are planned as future improvements beyond the current college prototype:
- **Interactive GPS Pin Drop**: Integration with Leaflet and OpenStreetMap so mobile street carts can update live geolocation coordinates.
- **Vendor Operational Toggle**: A real-time "Open Now / Closed Today" toggle on the vendor dashboard.
- **Automated SMS Notifications**: Sending SMS or WhatsApp alerts (via Twilio or Fast2SMS) when an admin approves or rejects a vendor application.
- **Server-Side Pagination**: Query-parameter pagination (`?page=1&limit=20`) to optimize backend throughput when vendor catalogs scale to thousands of records.
- **Direct Stall Photo Uploads**: Cloud image storage (e.g. Cloudinary or AWS S3) for stall and product photographs.

---

## 📜 Academic Disclaimer

This project was developed for a college computer engineering curriculum. It demonstrates foundational web development principles, native asynchronous JavaScript, secure cryptographic authentication, and direct database querying without heavy framework abstractions.
