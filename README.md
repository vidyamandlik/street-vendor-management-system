# 🏪 Street Vendor Management System (SVMS)

A complete, demo-ready platform that connects **street vendors** with **customers** and an **administrator** who verifies, moderates and analyses everything — built with a vanilla HTML/CSS/JavaScript frontend and a Node.js + Express + MongoDB backend.

---

## ✨ Features

### 🏠 Public
- **Enhanced home page** — hero, role selection (Vendor / Customer / Admin), features, how-it-works and footer.
- **Vendor directory** (`directory/vendors.html`) — search, category / district / minimum-rating filters, sorting (highest rated, most reviewed, A–Z, newest), live result count.
- **Public vendor details** (`directory/vendor-details.html?id=VND-xxxx`) — only **Verified** vendors are visible; profile, contact links (`tel:` / `mailto:`), rating summary, **rating distribution bars**, review list, favorite button, *Rate & Review* modal and an optional **Leaflet map** when the vendor saved coordinates.

### 🧑‍💼 Vendor
- Registration with **auto-generated `VND-xxxx` ID**, password (bcrypt), validation, status starts as **Pending**.
- Login with **Vendor ID + Password** (legacy accounts may sign in once with their registered mobile number; the credential is upgraded to a bcrypt hash automatically).
- Dashboard: profile views, average rating, review count, favorites, verification status, **availability control** (Open / Closed / Temporarily Unavailable), edit profile (the Vendor ID and status can never be changed), change password, review list & rating distribution, notifications.

### 👤 Customer
- Registration with **auto-generated `CUS-xxxx` ID**, bcrypt password, Indian mobile validation (`6-9` + 9 digits).
- Login with **Customer ID + Password** (legacy plain-text passwords are migrated to bcrypt on first login and at server start-up).
- Dashboard: profile view/edit, **verified vendor browsing** with search / category / district / rating filter / sort, **favorites** (persisted in MongoDB), **reviews** (create / edit / delete own only), **notifications** (bell badge + mark-all-read).
- **My Reviews** page (`customer/my-reviews.html`) — table of all reviews written with edit and delete (confirmation dialog).

### 🛡️ Admin
- Login with credentials from `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`, demo defaults `admin` / `admin123`).
- **Overview** — statistics cards (vendors, verified / pending / rejected, customers, reviews, average rating, profile views), status / category / district / availability distributions, top-rated vendors.
- **Vendor management** — search + status/category filter, Verify ✅, Reject ❌, Set Pending, Delete (cascades reviews, favorites and notifications).
- **Customer management** — search, activate / deactivate, review & favorite counters.
- **Review moderation** — approve / reject / delete any review; rejected reviews disappear from public ratings and listings.
- **Reports & analytics** — vendor/customer registration trends (last 12 months), rating distribution, review moderation counts, report summary.
- **Notifications** — admin inbox (new registrations, new reviews, …).
- **Settings** — platform health check and admin session info.

---

## 🛠️ Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript (no framework) |
| Backend   | Node.js + Express |
| Database  | MongoDB Atlas via the **native MongoDB driver** (no Mongoose) |
| Auth      | JWT (`jsonwebtoken`) + bcrypt password hashing (`bcryptjs`) |
| Maps      | Leaflet + OpenStreetMap (optional) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 24)
- A MongoDB Atlas connection string

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure `backend/.env`

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=<long-random-string>
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

> ⚠️ Never commit `.env` — it is already listed in `.gitignore`.

### 4. Run

```bash
npm start          # from backend/
# or
node backend/server.js   # from the project root
```

Then open **http://localhost:5000/** (the backend also serves the frontend) — or open `index.html` through any static server.

On start-up the server:
1. connects to MongoDB,
2. runs a **safe data migration** (hashes legacy plain-text passwords, backfills `createdAt` / `status` / `availability` / review `status`, converts string years to numbers),
3. creates **indexes** (unique IDs, unique email/mobile, one review per customer per vendor, one favorite per pair, …),
4. registers all API routes and starts listening.

---

## 📡 API Overview

All responses use a consistent envelope:

```json
{ "success": true, "message": "…", "data": … }
{ "success": false, "message": "…" }
```

Protected routes require `Authorization: Bearer <token>` and enforce the role with `authenticateToken` + `authorizeRole("admin" | "vendor" | "customer")`.

| Method | Endpoint | Role | Purpose |
|-------:|----------|------|---------|
| GET | `/api/health` | public | Health check |
| POST | `/api/admin/login` | public | Admin login |
| GET | `/api/admin/statistics` | admin | Full dashboard analytics |
| GET | `/api/vendors`, `/api/admin/vendors` | admin | Vendor list (no passwords) |
| POST | `/api/vendors` | public | Vendor registration |
| POST | `/api/vendors/login` | public | Vendor login |
| GET | `/api/vendors/:id` | vendor | Own profile + dashboard stats |
| PUT | `/api/vendors/:id` | vendor | Update own profile (whitelisted fields) |
| PUT | `/api/vendors/:id/password` | vendor | Change password |
| PUT | `/api/admin/vendors/:id/status` \| `/verify` \| `/reject` | admin | Vendor moderation |
| DELETE | `/api/vendors/:id` | admin | Delete vendor (+ cascade) |
| GET | `/api/public/vendors` | public | Verified vendors + aggregated ratings |
| GET | `/api/public/vendors/:id` | public | Verified vendor details (+ view counter) |
| POST | `/api/customers` | public | Customer registration |
| POST | `/api/customers/login` | public | Customer login |
| GET / PUT | `/api/customers/:id` | customer | Own profile |
| POST | `/api/reviews` | customer | Create review (1 per vendor) |
| GET | `/api/reviews/vendor/:vendorId` | public | Reviews + distribution |
| GET | `/api/reviews/mine` | customer | Own reviews |
| PUT | `/api/reviews/:reviewId` | owner / admin | Edit review **or** admin sets `status` |
| DELETE | `/api/reviews/:reviewId` | owner / admin | Delete review |
| DELETE | `/api/admin/reviews/:reviewId` | admin | Delete review (alias) |
| POST / GET / DELETE | `/api/favorites` … | customer | Persisted favorites |
| GET | `/api/notifications` | any role | Own notifications |
| PUT | `/api/notifications/read-all`, `/api/notifications/:id/read` | any role | Mark read |
| GET / PUT | `/api/admin/customers`, `/api/admin/customers/:id/status` | admin | Customer management |
| GET | `/api/admin/reviews?status=` | admin | Moderation queue |

### Collections (MongoDB `streetVendorDB`)
`vendors` · `customers` · `reviews` · `favorites` · `notifications`

Key indexes: unique `vendors.id`, unique `customers.id/email/mobile`, unique `reviews (customerId, vendorId)`, unique `favorites (customerId, vendorId)`, plus lookup indexes on `status`, `category`, `district`, `vendorId`, `customerId`, `userId+role`.

---

## 🔐 Security

- Passwords stored as **bcrypt hashes** and never returned by the API or rendered in the UI.
- **JWT** with 2-hour expiry, role-based authorization on every protected route (401 without a token, 403 for a wrong role / invalid or expired token).
- Vendors can **not** change their `id`, `status`, `password` or `profileViews`; customers can only read/update their **own** profile.
- Public endpoints only expose **Verified** vendors (pending/rejected vendors return 404 publicly).
- All user-generated content is rendered through `escapeHtml()` (**XSS-safe**).
- Validation on **both** sides: browser-side feedback plus authoritative backend validation (email, Indian mobile format, password length, rating 1–5, availability enum, coordinates range, text length limits).
- Consistent confirmation dialogs before destructive actions (delete vendor/review, logout, moderation).

---

## 🧪 Testing

- `node --check` on every JavaScript file (syntax).
- Live API workflow tests against a running server: registration → login → dashboard loads → reviews → favorites → notifications → admin statistics/moderation → security tests (invalid token, expired token, wrong role, pending vendor not public, password never leaked).

---

## 📁 Project Structure

```
street-vendor-management-system/
├── index.html                 # Landing page
├── css/style.css              # Global stylesheet (+ responsive design)
├── js/
│   ├── main.js                # Shared helpers: API wrapper, session, validation,
│   │                          #   toasts, confirm dialog, notifications, nav
│   ├── vendor.js               # Vendor register / login / dashboard
│   ├── customer.js             # Customer register / login / dashboard / my-reviews
│   ├── directory.js            # Public directory + vendor details
│   └── admin.js                # Admin login + dashboard
├── vendor/    register.html · login.html · dashboard.html
├── customer/  register.html · login.html · dashboard.html · my-reviews.html
├── admin/     login.html · dashboard.html
├── directory/ vendors.html · vendor-details.html
├── img/                          # Logo & images
└── backend/
    ├── server.js              # Express app: migration, indexes, all routes
    ├── package.json
    └── .env                   # MONGODB_URI, JWT_SECRET, PORT, ADMIN_*  (not committed)
```
