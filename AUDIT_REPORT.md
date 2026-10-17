# Street Vendor Management System — Comprehensive Audit Report

**Date of Audit:** October 15, 2026  
**Auditor:** Senior Project Mentor & Technical Auditor  
**Target Audience:** 2nd-Year Computer Engineering Team (Presentation Preparation)  
**Technology Stack:** Plain HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js (v5), Native MongoDB Driver (`mongodb` v7.5)  
**Audit Scope:** Complete codebase audit (read-only inspection, live runtime verification, and presentation risk assessment).

---

## 1. Executive Summary

### Issue Counts by Severity
| Severity | Count | Meaning for the Team |
| :--- | :---: | :--- |
| **Critical** | **5** | Must fix before any examiner sees the demo; security exposure, 404 assets, or broken code. |
| **High** | **7** | Serious flaws in validation, error handling, or hosting setup that examiners will question. |
| **Medium** | **12** | Poor user experience, browser `alert()` popups, missing scripts, or misleading documentation. |
| **Low** | **8** | Cosmetic inconsistencies, uncleaned backup files, or missing minor metadata (favicons). |
| **TOTAL** | **32** | Total documented findings across all categories. |

### Issue Counts by Category (A–M)
| Category | Description | Count |
| :---: | :--- | :---: |
| **A** | Backend Bugs & Security | 6 |
| **B** | Frontend JavaScript & Error Handling | 4 |
| **C** | UI / UX Structure & HTML Integrity | 3 |
| **D** | Visual Design & Broken Layout Assets | 3 |
| **E** | Deployment & Production Readiness | 4 |
| **F** | Live Presentation & Demo Risks | 3 |
| **G** | Hosting & File Structure Details | 3 |
| **H** | Git Repository Hygiene & History | 2 |
| **I** | Dependencies & Package Configuration | 2 |
| **J** | Codebase Complexity & README Integrity | 1 |
| **K** | Content Polish & Terminology | 1 |
| **L** | Sample Data & Demo Readiness | 1 |
| **M** | Scalability & Performance | 1 |

---

### Top 5 Most Urgent Fixes Before Presentation

1. **Remove the Missing CSS File Causing a 404 Error:**  
   [`admin/dashboard.html:8`](admin/dashboard.html#L8) and [`customer/dashboard.html:8`](customer/dashboard.html#L8) load `<link rel="stylesheet" href="../css/dashboard.css">`. The file `css/dashboard.css` **does not exist** on disk. If an examiner presses `F12` to inspect the browser console during your demo, a bright red `404 Not Found` network error will be immediately visible.

2. **Fix the Hardcoded Local Path on the Home Page:**  
   [`index.html:183`](index.html#L183) contains `<img src="C:\Users\as\Downloads\vendor.jpg" ...>`. This points to a teammate's private laptop folder. On any other machine or deployed server, this image fails to load and triggers the fallback icon.

3. **Stop Leaking Vendor Mobile Numbers and Emails on Public APIs:**  
   [`backend/server.js:1422`](backend/server.js#L1422) and [`backend/server.js:1465`](backend/server.js#L1465) in `GET /api/public/vendors` and `GET /api/public/vendors/:id` only project `{ password: 0 }`. This leaks private telephone numbers and email addresses to the public internet without login. It should project `{ password: 0, mobile: 0, email: 0 }` (or allow contact only when logged in).

4. **Replace Browser `alert()` Popups for Viewing Reviews:**  
   [`js/customer.js:1409`](js/customer.js#L1409) uses `window.alert(...)` to display customer reviews as a raw text string when a user clicks "View Reviews". Browser alert dialogs look amateurish and freeze the browser tab.

5. **Align `README.md` with What the Project Actually Does:**  
   [`README.md`](README.md) describes advanced features that do not exist in the code (such as `directory/vendor-details.html`, Leaflet maps, customer favorites, review moderation tables, and bcrypt auth). If examiners read the README, they will ask to see features you do not have.

---

## 2. Complete Issue Register (Categories A through M)

| ID | Severity | Category | File and Line | What is Wrong | Why It Matters | How to Fix | Effort | Status |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **A-01** | **Critical** | **A** | [`backend/server.js:1422`](backend/server.js#L1422), [`1465`](backend/server.js#L1465) | Public vendor routes return personal `mobile` and `email` without authentication. | Privacy violation; any web scraper can harvest vendor personal contact info. | In MongoDB projection, add `mobile: 0, email: 0`. | 5 min | Confirmed by running it |
| **A-02** | **High** | **A** | [`backend/server.js:1702`](backend/server.js#L1702) | Customer registration catch block lacks `error.code === 11000` duplicate handling. | If a duplicate email/phone is submitted, server crashes into 500 error instead of clean 409 conflict. | Add `if (error && error.code === 11000) return res.status(409).json({ message: "Email or mobile already registered." });` | 5 min | Found by reading code only |
| **A-03** | **High** | **A** | [`backend/server.js:198`](backend/server.js#L198) | Login rate limiter is keyed purely by `${req.ip}:${req.path}` in an in-memory Map. | In college Wi-Fi or NAT, 10 failed logins by one student lock out every student on the same network. | Key by `${req.ip}:${loginIdentifier}` or raise threshold for local presentations. | 30 min | Found by reading code only |
| **A-04** | **Medium** | **A** | [`backend/server.js:1332`](backend/server.js#L1332) | Vendor login allows "Pending" or "Rejected" vendors to log in without restriction. | Examiners may ask why an unverified or banned vendor can log into a vendor portal. | In `/api/vendors/login`, check status and provide informational response or restrict dashboard actions. | 30 min | Confirmed by running it |
| **A-05** | **Medium** | **A** | [`backend/server.js:1993`](backend/server.js#L1993) | Review text has no maximum character length validation. | Malicious or accidental submission of huge payloads can bloat MongoDB documents. | Add `if (cleanReview.length > 1000) return res.status(400).json({ message: "Review cannot exceed 1000 characters." });` | 5 min | Found by reading code only |
| **A-06** | **Low** | **A** | [`backend/server.js:77`](backend/server.js#L77), [`90`](backend/server.js#L90) | Noisy `console.log("REQUEST ORIGIN:", origin)` logs on every single HTTP request. | Clutters terminal during demonstration and leaks internal origin details. | Remove or comment out debug logs. | 5 min | Confirmed by running it |
| **B-01** | **High** | **B** | [`js/customer.js:1409`](js/customer.js#L1409) | Viewing reviews triggers a raw browser `alert()` dialog instead of rendering in UI. | Looks unfinished; examiners penalize projects that use alerts for primary data display. | Render reviews into an accessible modal or card container like `vendor.js` does. | 1 hour | Confirmed by running it |
| **B-02** | **Medium** | **B** | [`js/vendor.js:362`](js/vendor.js#L362), [`vendor/dashboard.html:627`](vendor/dashboard.html#L627) | Vendor dashboard does not redirect to login when JWT token is expired (401/403). | Expired vendor session leaves dashboard in a frozen half-loaded state with "Loading..." text. | In catch block or response check, if status is 401/403, clear auth keys and redirect to `login.html`. | 15 min | Found by reading code only |
| **B-03** | **Medium** | **B** | [`js/directory.js:1`](js/directory.js#L1) | `js/directory.js` (1,111 lines) is dead code not loaded by any HTML page. | Confuses team members and mentors; examiners inspecting files will see dead duplicate logic. | Delete `js/directory.js` or document it as legacy in comments. | 5 min | Confirmed by running it |
| **B-04** | **Low** | **B** | [`js/vendor.js:126`](js/vendor.js#L126) | Vendor registration form client validation omits check for `data.description`. | If description is empty, client passes it to backend which fails with 400. | Add `!data.description` to the check in `js/vendor.js`. | 5 min | Found by reading code only |
| **C-01** | **High** | **C** | [`customer/dashboard.html:25-29`](customer/dashboard.html#L25-L29) | Unclosed and commented HTML tags in `dash-stats` and `dash-user` blocks. | Causes invalid DOM tree; browser tries to auto-correct by mis-nesting layout elements. | Clean up HTML comments, ensure each `<div>` has an exact matching `</div>`. | 15 min | Confirmed by running it |
| **C-02** | **Medium** | **C** | [`vendor/payment.html:1`](vendor/payment.html#L1), [`vendor/schemes.html:1`](vendor/schemes.html#L1) | Both pages load `vendor.js` which registers listeners for forms not present on the page. | Harmless but generates console noise; creates confusion about what the pages actually do. | Remove unused `vendor.js` script tag from purely static informational pages. | 5 min | Confirmed by running it |
| **C-03** | **Low** | **C** | All registration forms | Passwords lack visual show/hide toggle. | Common usability complaint during live presentations when typing test passwords. | Add standard show/hide eye icon button next to password inputs. | 30 min | Found by reading code only |
| **D-01** | **Critical** | **D** | [`index.html:183`](index.html#L183) | Hardcoded local absolute path `C:\Users\as\Downloads\vendor.jpg` in hero image. | Image fails to load on any computer except the author's laptop; causes 404 in network tab. | Change `src` to `img/logo.png` or place a clean market image in `img/hero.jpg`. | 5 min | Confirmed by running it |
| **D-02** | **Critical** | **D** | [`admin/dashboard.html:8`](admin/dashboard.html#L8), [`customer/dashboard.html:8`](customer/dashboard.html#L8) | `<link rel="stylesheet" href="../css/dashboard.css">` references a nonexistent file. | Triggers browser 404 error on console; styles are already in `style.css`. | Delete the `<link rel="stylesheet" href="../css/dashboard.css">` line from both files. | 5 min | Confirmed by running it |
| **D-03** | **Medium** | **D** | [`css/style.css:1`](css/style.css#L1) | Monolithic stylesheet of 5,745 lines containing conflicting and duplicate selectors. | Hard to maintain; accidental overrides cause subtle layout shifts between pages. | Leave intact for presentation, but be prepared to explain it is a unified stylesheet. | Skip | Found by reading code only |
| **E-01** | **High** | **E** | [`backend/package.json:6`](backend/package.json#L6) | Missing `"start": "node server.js"` script in `backend/package.json`. | Cloud hosting platforms (Render, Railway, Heroku) run `npm start` by default and fail to deploy. | Add `"start": "node server.js"` under `"scripts"` in `backend/package.json`. | 5 min | Confirmed by running it |
| **E-02** | **High** | **E** | [`.gitignore:2`](.gitignore#L2) | Root `.gitignore` has Byte Order Mark (BOM) and Zero-Width Space (`\u200B.env`). | Git fails to ignore `.env` files in root; risk of accidentally committing production secrets. | Clean root `.gitignore` to standard ASCII/UTF-8 without BOM or zero-width spaces. | 5 min | Confirmed by running it |
| **E-03** | **Medium** | **E** | [`backend/server.js:52`](backend/server.js#L52) | `ALLOWED_ORIGINS` defaults only to localhost ports (5500, 3000, 5173). | If frontend is hosted on GitHub Pages or Vercel, requests get blocked by CORS. | Set `ALLOWED_ORIGINS` in production environment to include the deployed frontend domain. | 10 min | Found by reading code only |
| **E-04** | **Medium** | **E** | Deployment Host | Free-tier backends (e.g. Render free instance) sleep after 15 minutes of inactivity. | First click during an evaluation takes 30–60 seconds to respond ("cold start"). | Ping server 5 minutes before presentation begins so the instance is awake and responsive. | 0 min | Operational factor |
| **F-01** | **Critical** | **F** | [`README.md:12-33`](README.md#L12-L33) | `README.md` documents non-existent pages (`vendor-details.html`, `my-reviews.html`). | If an examiner clicks links or asks to see features listed in the README, demo fails. | Update `README.md` to accurately represent implemented features only. | 30 min | Confirmed by reading code only |
| **F-02** | **High** | **F** | [`backend/server.js:384`](backend/server.js#L384) | Admin login requires `ADMIN_PASSWORD_HASH` in `.env`, but README says `ADMIN_PASSWORD`. | Anyone following the README setup instructions cannot log in as Admin. | Document `npm run hash-password` step in README or support fallback plain text check for demo. | 15 min | Confirmed by running it |
| **F-03** | **Medium** | **F** | Demo flow | No confirmation modal when admin clicks "Reject" on vendor application. | Clicking "Reject" immediately updates status in database; accidental clicks look clumsy. | Add `confirm("Are you sure you want to reject this vendor?")` before dispatching API call. | 15 min | Found by reading code only |
| **G-01** | **Low** | **G** | Root directory | Typo folder `assests` (spelled a-s-s-e-s-t-s) exists and is completely empty. | Clutters repository structure; examiners notice misspelled folder names. | Delete the empty `assests` directory. | 5 min | Confirmed by running it |
| **G-02** | **Low** | **G** | [`img/img.png`](img/img.png) | `img/img.png` is an empty 0-byte file. | Corrupt placeholder file; wastes space and looks unprofessional. | Delete `img/img.png`. | 5 min | Confirmed by running it |
| **G-03** | **Low** | **G** | All HTML files | No `<link rel="icon">` favicon declared across any page. | Browser console logs a 404 GET `/favicon.ico` on every page visit. | Add `<link rel="icon" href="../img/logo.png">` in the `<head>` of all HTML pages. | 15 min | Confirmed by running it |
| **H-01** | **High** | **H** | Repository root | `node_modules_backup/` directory containing 1,473 files is tracked in Git. | Bloats git repository size by several megabytes and violates version control standards. | Run `git rm -r --cached node_modules_backup/` and add to `.gitignore`. | 10 min | Confirmed by running it |
| **H-02** | **Low** | **H** | Git history | Check whether `backend/.env` was ever committed in older commits. | Risk of leaked database passwords or secrets in commit history. | Audited: `backend/.env` was **never** committed to Git (passed inspection). | 0 min | Confirmed by running it |
| **I-01** | **Medium** | **I** | [`package.json:6`](package.json#L6) | Root `package.json` lists `mongoose: ^9.9.4`, but the app uses native MongoDB driver. | Unused heavy dependency; examiners may ask why Mongoose is installed if unused. | Remove `"mongoose"` from root `package.json`. | 5 min | Confirmed by reading code only |
| **I-02** | **Medium** | **I** | [`backend/package.json`](backend/package.json) | `npm audit` reports 1 Critical (`proxy-addr`) and 1 Moderate (`qs`) vulnerability. | Security auditors penalize known vulnerable dependencies in production builds. | Run `npm update` or `npm audit fix` in `/backend`. | 15 min | Confirmed by running it |
| **J-01** | **Medium** | **J** | Architectural sizing | Several files exceed 1,500 lines (`style.css`: 5,745; `server.js`: 2,590; `vendor.js`: 2,126). | Hard to explain file structure; examiners expect modular division of concerns. | Prepare clear explanations of major file sections for the viva (see `PROJECT_GUIDE.md`). | 30 min | Confirmed by reading code only |
| **K-01** | **Low** | **K** | Content polish | Inconsistent terminology: "Business Category" vs "Category"; "Rate & Review" vs "Write a Review". | Minor presentation inconsistency. | Standardize UI labels across customer and vendor dashboards. | 30 min | Found by reading code only |
| **L-01** | **High** | **L** | Database state | Initial database may have too few records or dummy test strings like "test@example.com". | An empty database looks unconvincing during a viva; live creation during demo wastes time. | Pre-populate realistic sample data using the UI before presentation day. | 1 hour | Confirmed by running it |
| **M-01** | **High** | **M** | [`backend/server.js:482`](backend/server.js#L482) | Admin vendor list loads all vendors from database without MongoDB pagination. | Fine for 20 vendors; will cause memory bloat and UI lag if scaling to 1,000+ vendors. | Explain to examiner that pagination is currently handled client-side and backend pagination is in future scope. | 0 min | Confirmed by reading code only |

---

## 3. Recommended Fix Schedule (2–3 Day Action Plan)

### Day 1: Demo-Breakers & Visual Fixes (Total Time: ~1.5 hours)
* [ ] **Fix D-02:** Remove `<link rel="stylesheet" href="../css/dashboard.css">` from `admin/dashboard.html` and `customer/dashboard.html`. (Fixes 404 in console).
* [ ] **Fix D-01:** Fix image path in `index.html:183` from `C:\Users\as\Downloads\vendor.jpg` to `img/logo.png`.
* [ ] **Fix A-01:** Hide private mobile numbers and email in `GET /api/public/vendors` (`backend/server.js:1422, 1465`).
* [ ] **Fix E-01:** Add `"start": "node server.js"` into `backend/package.json`.
* [ ] **Fix A-02:** Add `error.code === 11000` duplicate check in customer registration (`server.js:1702`).

### Day 2: Polish & Presentation Alignment (Total Time: ~2 hours)
* [ ] **Fix F-01:** Update `README.md` to remove claims about nonexistent pages (`vendor-details.html`, Leaflet maps, etc.) so it matches reality.
* [ ] **Fix B-01:** Replace the `alert()` in `js/customer.js:1409` with modal/card display or clean inline text.
* [ ] **Fix C-01:** Clean up the malformed HTML comment and closing `</div>` tags in `customer/dashboard.html:25-29`.
* [ ] **Fix B-02:** Add expired-token redirect in `vendor/dashboard.html` when profile fetch returns 401/403.
* [ ] **Fix H-01 & G-01:** Untrack `node_modules_backup/` from Git and delete the empty `assests` folder.

### Day 3: Rehearsal & Sample Data (Total Time: ~2 hours)
* [ ] **Task L-01:** Walk through the complete registration and approval flow using the web UI to create:
  * 6 Verified Vendors across 3 categories (Food, Fruits & Vegetables, Clothing) and 2 districts.
  * 2 Pending Vendors (to demonstrate the Admin approval workflow).
  * 3 Customer accounts with 6 realistic reviews and star ratings.
* [ ] **Rehearse Demo Script:** Practice the 5–7 minute walkthrough in `PROJECT_GUIDE.md`.
* [ ] **Viva Q&A Practice:** Rehearse answers to the 15 examiner questions in `PROJECT_GUIDE.md`.

---

## 4. "Do Not Touch" List (High-Risk Areas to Preserve)

Do **NOT** refactor or rewrite the following before your presentation:
1. **Do not migrate to Mongoose or React:** The native MongoDB driver and vanilla JS are working cleanly; introducing a framework 2 days before presentation risks breaking everything.
2. **Do not change password hashing from `crypto.scrypt`:** The existing scrypt implementation is cryptographically strong and well-integrated.
3. **Do not modify the database collections or ID fields (`id`, `vendorId`, `customerId`):** The code relies on string-matching these keys across JWT, reviews, and `$lookup` aggregations.
4. **Do not attempt to split `css/style.css`:** The CSS is large (5,700 lines), but all pages render predictably. Splitting it now risks broken styling across forms and cards.

---

## 5. Scope Verification Notice

* **Tested & Verified:** Backend startup, database connection, API response headers, public endpoints, rate limiting responses, HTML link integrity, JS syntax checks (`node --check`), git history inspection, and script execution order.
* **Unverified / Environmental Factors:** Production domain behavior under high latency or sleeping free-tier hosting (Render/Railway), which depends on live cloud configuration.

