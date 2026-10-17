# Street Vendor Management System — Student Presentation & Viva Guide

**Purpose of this Guide:** To help 2nd-year engineering students understand every component of their project, confidently present their system in 5–7 minutes, and ace their oral viva examination.

---

## 1. What the System Does & The Three User Roles

The **Street Vendor Management System** is a localized web portal designed to formalize and digitize informal street commerce. It connects three distinct user groups:

1. **The Vendor:** A local merchant who registers their business (stalls, food carts, artisans), manages product catalogs and operating hours, tracks verification status, and accesses financial education modules (digital payments and government welfare schemes).
2. **The Customer:** A local citizen who browses verified street vendors, filters stalls by category and district, views menus, and submits authentic ratings and reviews.
3. **The Administrator:** A municipal or platform supervisor who inspects submitted vendor applications, verifies authentic documentation, approves or rejects vendors, and ensures only legitimate businesses appear on public discovery channels.

---

## 2. System Architecture & Request Lifecycle

```
[ User Browser / HTML Client ]
          │  ▲
   Fetch  │  │ JSON Response + JWT
 (Config) │  │
          ▼  │
[ Express.js REST API Server (Port 5000) ]
   ├── CORS & JSON Body Parser
   ├── Rate Limiter (limitLoginAttempts)
   ├── Auth Middleware (authenticateToken, authorizeRole)
   └── Route Handlers (/api/vendors, /api/customers, /api/admin)
          │  ▲
 Native   │  │ BSON Documents
 Driver   │  │
          ▼  │
[ MongoDB Database ("streetVendorDB") ]
   ├── vendors (Collection)
   ├── customers (Collection)
   └── reviews (Collection)
```

### Trace of a Single Action (Example: Customer Login)
1. **User Action:** Customer inputs their ID/Email and password on `customer/login.html` and clicks "Login".
2. **Client Script (`js/customer.js`):** Intercepts the submit event, validates inputs, and issues `fetch(API_BASE_URL + "/customers/login", { method: "POST", body: ... })`.
3. **Network Config (`js/config.js`):** Dynamically provides `API_BASE_URL` (points to `localhost:5000/api` locally or cloud URL in production).
4. **Backend Route (`backend/server.js`):**
   * Passes through `limitLoginAttempts` middleware to prevent brute force attacks.
   * Finds customer document in MongoDB via `{ $or: [{ id }, { email }, { mobile }] }`.
   * Verifies password using `verifyPassword(...)` with `crypto.scrypt` against the stored salt and hash.
   * Signs a JSON Web Token (JWT) with `{ id, role: "customer", name }` using `process.env.JWT_SECRET`.
5. **Client Storage:** The browser receives `{ token, customer }`, stores the token in `localStorage` (`authToken`), and redirects the user to `customer/dashboard.html`.
6. **Subsequent Calls:** When loading the dashboard, `fetch()` sends `headers: { "Authorization": "Bearer <token>" }` which backend middleware verifies before returning private data.

---

## 3. Directory of All Frontend Pages

| Page Path | Target Role | Primary Purpose & Features |
| :--- | :--- | :--- |
| [`index.html`](index.html) | Public | Main landing page; introduces platform mission, role cards, and navigation links. |
| [`admin/login.html`](admin/login.html) | Admin | Secure login form for platform administrators. |
| [`admin/dashboard.html`](admin/dashboard.html) | Admin | Vendor application management table; supports search, status filtering (Pending/Verified/Rejected), and single-click Approve/Reject actions. |
| [`customer/login.html`](customer/login.html) | Customer | Customer authentication via Customer ID (`CUS-XXXX`), Email, or 10-digit mobile number. |
| [`customer/register.html`](customer/register.html) | Customer | Customer account creation with automatic `CUS-XXXX` allocation and 10-digit phone validation. |
| [`customer/dashboard.html`](customer/dashboard.html) | Customer | Personal profile card, verified vendor discovery with category/district filters, and review submission modal. |
| [`directory/vendors.html`](directory/vendors.html) | Customer / Public | Dedicated directory catalog of all verified vendors with filter and search controls. |
| [`vendor/login.html`](vendor/login.html) | Vendor | Vendor authentication using assigned Vendor ID (`VND-XXXX`) and password. |
| [`vendor/register.html`](vendor/register.html) | Vendor | Multi-field application form (stall name, category, district, address, years in business, description) generating initial `Pending` status. |
| [`vendor/dashboard.html`](vendor/dashboard.html) | Vendor | Main vendor management portal: verification badge, catalog manager (add/edit products, in-stock toggles), operating hours, and customer review list. |
| [`vendor/payment.html`](vendor/payment.html) | Vendor | Educational resource guide detailing UPI setup, QR code guidelines, and fraud prevention tips. |
| [`vendor/schemes.html`](vendor/schemes.html) | Vendor | Government scheme guide explaining PM SVANidhi micro-credit, Mudra loans, and official portal links. |

---

## 4. Complete Backend API Route Reference

| Method | Path | Allowed Roles | Description & Database Impact |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Health status check; confirms backend is running. |
| `POST` | `/api/admin/login` | Public | Validates admin credentials against `.env` and returns admin JWT. |
| `GET` | `/api/vendors` | Public | Returns all vendors with `status: "Verified"`. |
| `GET` | `/api/admin/vendors` | Admin | Returns all vendor applications (Pending, Verified, Rejected) for admin moderation. |
| `POST` | `/api/vendors` | Public | Registers a new vendor application with auto-generated `VND-XXXX` ID and `status: "Pending"`. |
| `GET` | `/api/vendors/:id` | Vendor (Self) | Retrieves private profile data for the authenticated vendor (`req.user.id === id`). |
| `PUT` | `/api/vendors/:id` | Vendor (Self) | Updates vendor profile information (mobile, email, address, description). |
| `PUT` | `/api/vendors/:id/shop-details`| Vendor (Self) | Updates operational hours, operating days, and product catalog items with deduplication checks. |
| `PUT` | `/api/admin/vendors/:id/status`| Admin | Moderation action: updates vendor status to `Verified` or `Rejected`. |
| `POST` | `/api/vendors/login` | Public | Authenticates vendor by `VND-XXXX` ID and returns vendor JWT. |
| `GET` | `/api/public/vendors` | Public | Public endpoint for verified vendor directory discovery. |
| `GET` | `/api/public/vendors/:id` | Public | Retrieves public details for a single verified vendor. |
| `POST` | `/api/customers` | Public | Registers a new customer account with auto-generated `CUS-XXXX` ID. |
| `POST` | `/api/customers/login` | Public | Authenticates customer by ID, email, or mobile, returning customer JWT. |
| `GET` | `/api/customers/:id` | Customer (Self) | Retrieves profile data for the authenticated customer (`req.user.id === id`). |
| `POST` | `/api/reviews` | Customer | Submits a 1–5 star rating and review for a verified vendor; updates existing review if already present. |
| `GET` | `/api/reviews/vendor/:vendorId` | Public | Retrieves paginated reviews and calculates average rating and total review counts via MongoDB aggregation. |

---

## 5. Database Schema (MongoDB `streetVendorDB`)

### Collection 1: `vendors`
* `id` *(String, Indexed, Unique)*: Unique format `VND-XXXX` (e.g. `VND-4821`).
* `name` *(String)*: Legal owner's full name.
* `mobile` *(String, Indexed, Unique)*: 10-digit mobile number.
* `email` *(String, Indexed, Unique)*: Contact email address.
* `password` *(String)*: Salted hash (`salt:derivedKeyHex`).
* `businessName` *(String)*: Stall or trade name (e.g. "Ramesh Chaat Corner").
* `category` *(String)*: Trade domain (`Food`, `Fruits and Vegetables`, `Clothing`, `Accessories`, `Grocery`, `Other`).
* `district` *(String)*: Operational municipality or district.
* `address` *(String)*: Physical street vending location.
* `years` *(Number)*: Experience in vending ($0$–$100$).
* `description` *(String)*: Stall specialty or narrative.
* `status` *(String)*: Verification state: `"Pending"`, `"Verified"`, or `"Rejected"`.
* `createdAt` *(Date)*: Record timestamp.
* `shopDetails` *(Object, Optional)*:
  * `days` *(Array of Strings)*: Active business days.
  * `closingDay` *(String)*: Weekly holiday.
  * `openingTime` / `closingTime` *(String)*: Operating hours.
  * `products` *(Array of Objects)*: `[{ name, price, description, available }]`.

### Collection 2: `customers`
* `id` *(String, Indexed, Unique)*: Unique customer ID format `CUS-XXXX` (e.g. `CUS-1001`).
* `name` *(String)*: Customer name.
* `mobile` *(String, Indexed, Unique)*: 10-digit phone number.
* `email` *(String, Indexed, Unique)*: Email address.
* `password` *(String)*: Salted hash (`salt:derivedKeyHex`).
* `createdAt` *(Date)*: Account creation timestamp.

### Collection 3: `reviews`
* `_id` *(ObjectId)*: Unique document ID.
* `customerId` *(String, Indexed)*: Identifier matching `customers.id`.
* `vendorId` *(String, Indexed)*: Identifier matching `vendors.id`.
* `rating` *(Number)*: Integer from 1 to 5.
* `review` *(String)*: Feedback commentary.
* `createdAt` *(Date)*: Timestamp.
* *Compound Index:* `{ customerId: 1, vendorId: 1 }` with `{ unique: true }`.

---

## 6. How Authentication, Tokens & Roles Work

* **Hashing Mechanism:** Implemented using Node.js built-in `crypto.scrypt` (via `scryptAsync`) with a 16-byte random salt and 64-byte key length. Passwords are never stored in plain text.
* **Verification:** `verifyPassword(password, storedPassword)` splits the stored string into salt and hash, re-computes `scrypt`, and checks equality with `crypto.timingSafeEqual` to avoid timing side-channel leaks.
* **Token Creation:** Upon valid login, `jwt.sign(...)` produces a compact token signed with a server secret (`process.env.JWT_SECRET`) with a 2-hour expiration (`expiresIn: "2h"`).
* **Token Payload:** Contains `{ id, role, name }`.
* **Backend Authorization Guards:**
  * [`authenticateToken`](backend/server.js#L268): Extracts token from `Authorization: Bearer <token>`, verifies signature with `jwt.verify()`, and attaches payload to `req.user`.
  * [`authorizeRole(requiredRole)`](backend/server.js#L311): Confirms `req.user.role === requiredRole`, rejecting unauthorized access with HTTP 403 Forbidden.

---

## 7. How Vendor Verification Works (The Lifecycle)

```
[ Step 1: Registration ] 
Vendor submits form ──► Saved in MongoDB with status: "Pending" 
                         (Cannot appear on Customer Directory)
                               │
                               ▼
[ Step 2: Admin Inspection ]
Admin logs into /admin/dashboard.html ──► Views pending applicants
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
         [ APPROVE ]                        [ REJECT ]
  Status updated to "Verified"       Status updated to "Rejected"
              │                                 │
              ▼                                 ▼
[ Step 3: Public Discovery ]         Hidden from customer directory
Appears on customer directory;       (Cannot receive public reviews)
Can receive customer reviews
```

---

## 8. How Reviews & Ratings Work

1. **Submission (`POST /api/reviews`):**
   * Customer must be authenticated (`role === "customer"`).
   * System verifies that the target vendor is currently `Verified`.
   * Queries `reviewsCollection.findOne({ customerId, vendorId })`. If an existing review is found, it updates the record; otherwise, it inserts a new review.
2. **Aggregation (`GET /api/reviews/vendor/:vendorId`):**
   * Uses MongoDB Aggregation Pipeline:
     * `$match`: Filters by `vendorId`.
     * `$lookup`: Joins customer collection (`from: "customers", localField: "customerId", foreignField: "id"`) to securely pull the customer's display name without exposing their password.
     * Computes average star rating and total review counts mathematically.

---

## 9. Implemented Security Features vs. Known Weaknesses

| Implemented Security Feature | How It Protects the Application | Known Weakness / Limitation to Admit Honestly |
| :--- | :--- | :--- |
| **`crypto.scrypt` Password Hashing** | Protects against rainbow tables and dictionary attacks using unique 16-byte salts. | Computational cost must be balanced on low-spec server hardware. |
| **JWT Role-Based Authorization** | Enforces endpoint security across customer, vendor, and admin operations. | Tokens are stored in `localStorage` rather than `HttpOnly` cookies, making them theoretically vulnerable to XSS if an injection flaw existed. |
| **HTML Sanitization (`escapeHtml`)** | Converts `<`, `>`, `&`, `"`, `'` to safe HTML entities prior to DOM insertion. | Does not cover attribute-based injection if arbitrary URLs were accepted. |
| **Login Rate Limiter** | Restricts brute force attacks to 10 attempts per 15-minute window. | Uses in-memory map keyed by client IP; resets on server reboot and may throttle shared NAT/Wi-Fi users. |
| **CORS Filtering** | Rejects unauthorized origins from reading API data. | Requires explicit configuration of production origins in `.env` to prevent cross-origin blocks. |

---

## 10. Fifteen Likely Examiner Questions & Correct Viva Answers

**Q1: Why did your team choose MongoDB instead of a relational database like MySQL?**  
*Answer:* "Street vendors have semi-structured, evolving data. A vendor's product catalog is dynamic—one seller offers 20 items, another offers 2, and operating days vary widely. MongoDB's flexible document structure allows us to embed shop details and product arrays naturally without creating 4 separate relational join tables."

**Q2: How are user passwords stored in the database?**  
*Answer:* "We never store plain text passwords. We use Node.js's built-in `crypto.scrypt` key derivation function with a cryptographically secure 16-byte random salt. The resulting salt and derived hash are stored together separated by a colon, and verification uses `crypto.timingSafeEqual` to prevent timing attacks."

**Q3: Why use JWT instead of standard server-side sessions?**  
*Answer:* "JWT is stateless. The server does not need to store active session records in memory or a database session store. The client carries its own cryptographically signed token containing its ID and role, which allows our backend API to scale horizontally without session synchronization."

**Q4: What prevents a vendor from editing another vendor's products or profile?**  
*Answer:* "Our backend enforces object-level authorization. On routes like `PUT /api/vendors/:id`, the route verifies that the authenticated user's ID extracted from the verified JWT (`req.user.id`) matches the URL parameter (`req.params.id`). If they differ, the server immediately returns a 403 Forbidden."

**Q5: What happens when a user's JWT token expires?**  
*Answer:* "Our tokens have an expiration of 2 hours. When a token expires, the backend rejects API requests with HTTP 401 or 403. In our customer dashboard, `loadCustomerProfile` detects this status, cleans up localStorage auth keys, and redirects the user back to the login page."

**Q6: How do you prevent one customer from spamming multiple reviews on a vendor?**  
*Answer:* "We protect review integrity on two levels: in the application logic, `POST /api/reviews` checks for an existing review by that customer and updates it instead of creating duplicates. At the database layer, we enforce a MongoDB compound unique index on `{ customerId: 1, vendorId: 1 }`."

**Q7: Can an unverified vendor appear in the customer search directory?**  
*Answer:* "No. All public discovery queries (`GET /api/public/vendors` and customer dashboard queries) enforce an explicit database filter `{ status: 'Verified' }`. Newly registered vendors start with a status of 'Pending' and are only displayed after admin approval."

**Q8: Why does the project use the native MongoDB driver instead of Mongoose?**  
*Answer:* "The native driver gives us direct control over MongoDB aggregation pipelines, indexing, and projection without the overhead, schema abstraction layer, or version deprecation issues associated with an ORM/ODM like Mongoose."

**Q9: How did you solve the problem of customer search ignoring stall names?**  
*Answer:* "Initially, the search filter only checked `vendor.name` (the owner's legal name). We updated `applyVendorFilters()` in `js/customer.js` to normalize and evaluate both `vendor.name` and `vendor.businessName`, allowing users to search by either the owner's name or stall name."

**Q10: What is the purpose of `js/config.js`?**  
*Answer:* "It decouples our frontend from hardcoded URLs. It inspects `location.hostname`—if it detects `localhost`, `127.0.0.1`, or `file:`, it directs API calls to `http://localhost:5000/api`. In a production cloud deployment, it switches to the live hosted backend URL automatically."

**Q11: How do you prevent Cross-Site Scripting (XSS) attacks in the frontend?**  
*Answer:* "We use an `escapeHtml()` sanitization utility across our JavaScript rendering logic to convert special characters (`<`, `>`, `&`, `"`) into HTML character entities before injecting strings into DOM templates. In the customer dashboard, we also build vendor cards using `document.createElement()` and `textContent`."

**Q12: What does the admin dashboard do?**  
*Answer:* "The admin dashboard is an operational moderation tool. It displays all registered vendors in a table with search and status filtering, allowing the administrator to inspect registration details and approve or reject applications with immediate database status updates."

**Q13: How is rate limiting implemented?**  
*Answer:* "We implemented a custom sliding-window middleware (`limitLoginAttempts`) in `backend/server.js`. It tracks client requests in an in-memory Map keyed by client IP and route, allowing a maximum of 10 failed login attempts within a 15-minute window before responding with HTTP 429 Too Many Requests."

**Q14: What are `vendor/payment.html` and `vendor/schemes.html`?**  
*Answer:* "They are dedicated financial literacy and welfare modules for vendors. `payment.html` provides instructions on accepting UPI payments securely and avoiding payment scams, while `schemes.html` informs vendors about central government welfare initiatives like PM SVANidhi working-capital loans."

**Q15: If you had another month to work on this project, what major feature would you build next?**  
*Answer:* "We would implement real-time geolocation tracking using Leaflet and WebSockets, so mobile vendors (like carts and hawkers) can broadcast their live street coordinates to nearby customers on an interactive city map."

---

## 11. Step-by-Step 5–7 Minute Live Demo Script

### Preparation Checklist (5 Minutes Before Entering the Room)
* Start backend server: `cd backend && node server.js`
* Ensure MongoDB Atlas or local MongoDB is running (`MongoDB connected successfully!`).
* Open Chrome/Edge at `1280px` desktop width. Have Developer Tools closed (or clear console).
* Have your Admin password ready.

### Walkthrough Sequence (Exactly 6 Minutes)

#### Step 1: The Public Landing Page (1 Minute)
* Open `index.html`.
* **What to say:** *"Good morning professors. Our project is the Street Vendor Management System, built using vanilla HTML/CSS/JS and a Node.js Express backend with MongoDB. It creates a verified digital marketplace for street micro-entrepreneurs. As you can see, our landing page introduces the platform and provides dedicated entry points for Vendors, Customers, and Administrators."*

#### Step 2: Vendor Registration (1.5 Minutes)
* Click **"Vendor Register"** (or open `vendor/register.html`).
* Fill in:
  * Name: `Sunil Verma`
  * Mobile: `9820011223`
  * Email: `sunil.chaat@gmail.com`
  * Password: `Password@123`
  * Business Name: `Verma Chaat & Bhel`
  * Category: `Food`
  * District: `Central`
  * Address: `Corner of Station Road, Stall #4`
  * Years: `6`
  * Description: `Authentic Sev Puri, Bhel, and Pani Puri made with mineral water.`
* Click **"Register"**.
* Show the success message and generated ID (e.g. `VND-XXXX`).
* **What to say:** *"Notice that the system automatically allocated a standardized Vendor ID (`VND-XXXX`). At this moment, Sunil's status is 'Pending'. He cannot be seen by customers yet."*

#### Step 3: Admin Approval Workflow (1.5 Minutes)
* Open a new tab or navigate to `admin/login.html`.
* Log in as Admin (`admin` / password).
* Navigate to `admin/dashboard.html`.
* Filter status by **"Pending"** or search for `"Sunil"`.
* Point out Sunil's application. Click the green **"Approve"** button.
* Notice the badge immediately changes to green **"Verified"**.
* **What to say:** *"The administrator acts as the quality and trust checkpoint. By clicking Approve, the vendor's record is updated to 'Verified' in MongoDB via a secured REST API."*

#### Step 4: Customer Discovery & Review (2 Minutes)
* Log into customer dashboard: `customer/login.html` (or log in as an existing customer).
* Show the **Find Verified Vendors** catalog.
* Point out that `Verma Chaat & Bhel` now appears with its category and district!
* Test the search bar: type `"Bhel"`—demonstrate that searching by stall name filters accurately.
* Click **"Rate & Review"** on the vendor card.
* Give a **5-Star** rating and comment: *"Best Pani Puri in the district, very hygienic!"*
* Submit review.
* Click **"View Reviews"** to demonstrate that the customer review was persisted in MongoDB and updated the vendor's average rating.

### What NOT to Click During the Demo!
* ⚠️ **Do NOT click "Reject"** on all vendors—leave at least 4 verified vendors so the directory stays populated.
* ⚠️ **Do NOT enter invalid phone numbers** (less than 10 digits) during a live demo unless an examiner explicitly asks to test validation.
* ⚠️ **Do NOT spam 10 failed logins** on the admin page, or the IP rate limiter will lock you out for 15 minutes!

