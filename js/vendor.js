// =====================================================
// STREET VENDOR MANAGEMENT SYSTEM - VENDOR MODULE
// =====================================================

const API_BASE_URL = window.APP_CONFIG.API_BASE_URL;

// =====================================================
// LOCAL STORAGE KEYS (Standardized & Backward Compatible)
// =====================================================

const AUTH_TOKEN_KEY = "authToken";
const USER_ROLE_KEY = "userRole";
const USER_ID_KEY = "userId";
const USER_NAME_KEY = "userName";

const VENDOR_TOKEN_KEY = "vendorToken";
const VENDOR_ROLE_KEY = "vendorRole";
const VENDOR_ID_KEY = "loggedInVendorId";

function getVendorAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(VENDOR_TOKEN_KEY);
}

function getVendorAuthRole() {
    return localStorage.getItem(USER_ROLE_KEY) || localStorage.getItem(VENDOR_ROLE_KEY);
}

function getVendorAuthId() {
    return localStorage.getItem(USER_ID_KEY) || localStorage.getItem(VENDOR_ID_KEY);
}

function getCustomerReviewToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem("customerToken");
}

function getCustomerReviewRole() {
    return localStorage.getItem(USER_ROLE_KEY) || localStorage.getItem("customerRole");
}


// =====================================================
// UTILITY
// =====================================================

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function debounce(func, delay = 250) {
    let timeoutId;

    return function (...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}


// =====================================================
// API RESPONSE HELPER
// =====================================================

async function getResponseData(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            message: text
        };
    }
}


// =====================================================
// VENDOR REGISTRATION
// =====================================================

async function handleVendorRegistration(event) {
    event.preventDefault();

    const form = event.target;

    const submitBtn =
        form.querySelector("button[type='submit']") ||
        document.querySelector("#vendorForm button[type='submit']");

    const originalBtnText =
        submitBtn ? submitBtn.textContent : "Register as Vendor";

    const data = {
        name: document.getElementById("vendorName")?.value.trim(),
        mobile: document.getElementById("mobile")?.value.trim(),
        email: document.getElementById("email")?.value.trim(),
        password: document.getElementById("vendorPassword")?.value,

        businessName:
            document.getElementById("businessName")?.value.trim(),

        category:
            document.getElementById("category")?.value.trim(),

        district:
            document.getElementById("district")?.value.trim(),

        address:
            document.getElementById("address")?.value.trim(),

        years:
            document.getElementById("years")?.value,

        description:
            document.getElementById("description")?.value.trim()
    };

    const confirmPassword =
        document.getElementById("confirmPassword")?.value;

    const errorElement =
        document.getElementById("vendorRegisterError");

    if (errorElement) {
        errorElement.textContent = "";
    }

    if (
        !data.name ||
        !data.mobile ||
        !data.email ||
        !data.password ||
        !confirmPassword ||
        !data.businessName ||
        !data.category ||
        !data.district ||
        !data.address ||
        data.years === "" ||
        !data.description
    ) {
        if (errorElement) {
            errorElement.textContent =
                "Please fill all required fields.";
            errorElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        return;
    }

    if (!/^[0-9]{10}$/.test(data.mobile)) {
        if (errorElement) {
            errorElement.textContent =
                "Mobile number must be exactly 10 digits.";
            errorElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        if (errorElement) {
            errorElement.textContent =
                "Please enter a valid email address.";
            errorElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        return;
    }

    if (data.password.length < 8) {
        if (errorElement) {
            errorElement.textContent =
                "Password must be at least 8 characters.";
            errorElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        return;
    }

    if (data.password !== confirmPassword) {
        if (errorElement) {
            errorElement.textContent =
                "Passwords do not match.";
            errorElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        return;
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Registering...";
        }

        const response = await fetch(
            `${API_BASE_URL}/vendors`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );

        const result = await getResponseData(response);

        console.log("Vendor registration response:", result);

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Vendor registration failed."
            );
        }

        form.style.display = "none";

        const successMessage =
            document.getElementById("successMessage");

        const vendorIdElement =
            document.getElementById("vendorId");

        const generatedVendorId =
            result.vendorId ||
            result.vendor?.id ||
            result.id;

        if (vendorIdElement) {
            vendorIdElement.textContent =
                generatedVendorId || "Generated successfully";
        }

        if (successMessage) {
            successMessage.style.display = "block";

            successMessage.scrollIntoView({
                behavior: "smooth"
            });
        }

    } catch (error) {
        console.error("Vendor registration error:", error);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }

        if (errorElement) {
            errorElement.textContent =
                error.message ||
                "Vendor registration failed.";
            errorElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }
}


// =====================================================
// VENDOR LOGIN
// =====================================================

async function handleVendorLogin(event) {
    event.preventDefault();

    const submitBtn =
        event.target.querySelector("button[type='submit']") ||
        document.querySelector("#vendorLoginForm button[type='submit']");

    const originalBtnText =
        submitBtn ? submitBtn.textContent : "Login as Vendor";

    const vendorId =
        document.getElementById("vendorIdLogin")?.value.trim();

    const password =
        document.getElementById("vendorPasswordLogin")?.value;

    const errorElement =
        document.getElementById("vendorLoginError");

    if (errorElement) {
        errorElement.textContent = "";
    }

    if (!vendorId || !password) {
        if (errorElement) {
            errorElement.textContent =
                "Please enter Vendor ID and password.";
        }

        return;
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Logging in...";
        }

        const response = await fetch(
            `${API_BASE_URL}/vendors/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    id: vendorId,
                    password: password
                })
            }
        );

        const result = await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Invalid Vendor ID or password."
            );
        }

        if (!result.token) {
            throw new Error(
                "Login successful, but authentication token was not received."
            );
        }

        const token = result.token;
        const role = result.role || "vendor";
        const id = result.vendor?.id || result.id || vendorId;
        const name = result.vendor?.name || result.name || "Vendor";

        // Standardized authentication keys
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(USER_ROLE_KEY, role);
        localStorage.setItem(USER_ID_KEY, id);
        localStorage.setItem(USER_NAME_KEY, name);

        // Backward-compatible keys
        localStorage.setItem(VENDOR_TOKEN_KEY, token);
        localStorage.setItem(VENDOR_ROLE_KEY, role);
        localStorage.setItem(VENDOR_ID_KEY, id);

        console.log("Vendor login saved successfully.");

        // Redirect to vendor dashboard
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Vendor login error:", error);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }

        if (errorElement) {
            errorElement.textContent =
                error.message ||
                "Vendor login failed.";
        } else {
            alert(
                error.message ||
                "Vendor login failed."
            );
        }
    }
}


// =====================================================
// VENDOR LOGOUT
// =====================================================

function logoutVendor() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(VENDOR_TOKEN_KEY);
    localStorage.removeItem(VENDOR_ROLE_KEY);
    localStorage.removeItem(VENDOR_ID_KEY);

    window.location.href = "../index.html";
}

// Backwards-compatible alias for any template or inline calls
function vendorLogout() {
    logoutVendor();
}

function clearVendorSessionSilently() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(VENDOR_TOKEN_KEY);
    localStorage.removeItem(VENDOR_ROLE_KEY);
    localStorage.removeItem(VENDOR_ID_KEY);
}

function checkExistingVendorSession() {
    const token = getVendorAuthToken();
    const role = getVendorAuthRole();
    const vendorId = getVendorAuthId();

    if (!token || !role || !vendorId) {
        return;
    }

    if (role !== "vendor") {
        return;
    }

    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            clearVendorSessionSilently();
            return;
        }

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        const payload = JSON.parse(jsonPayload);

        if (payload.role !== "vendor" || (payload.exp && payload.exp * 1000 <= Date.now())) {
            clearVendorSessionSilently();
            return;
        }

        window.location.replace("dashboard.html");
    } catch {
        clearVendorSessionSilently();
    }
}



// =====================================================
// LOAD LOGGED-IN VENDOR PROFILE
// =====================================================

async function loadVendorProfile() {
    const token = getVendorAuthToken();
    const vendorId = getVendorAuthId();

    if (!token || !vendorId) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/vendors/${encodeURIComponent(vendorId)}`,
            {
                method: "GET",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result =
            await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to load vendor profile."
            );
        }

        displayVendorProfile(result);

    } catch (error) {
        console.error(
            "Vendor profile loading error:",
            error
        );

        alert(
            error.message ||
            "Unable to load vendor profile."
        );
    }
}


// =====================================================
// DISPLAY VENDOR PROFILE
// =====================================================

function displayVendorProfile(vendor) {
    const fields = {
        vendorName: vendor.name,
        businessName: vendor.businessName,
        mobile: vendor.mobile,
        email: vendor.email,
        category: vendor.category,
        district: vendor.district,
        address: vendor.address,
        years: vendor.years,
        description: vendor.description,
        vendorId: vendor.id
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value ?? "";
        }
    });
}


// =====================================================
// CUSTOMER LOGIN CHECK
// =====================================================

function isCustomerLoggedIn() {
    const token = getCustomerReviewToken();
    const role = getCustomerReviewRole();

    return Boolean(
        token &&
        role === "customer"
    );
}


// =====================================================
// PUBLIC VENDOR PROFILE
// =====================================================

async function loadPublicVendorProfile(vendorId) {
    const mainContent =
        document.getElementById("mainContent");

    if (!mainContent) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/public/vendors/${encodeURIComponent(vendorId)}`
        );

        const vendor =
            await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                vendor.message ||
                "Vendor not found."
            );
        }

        renderVendorProfile(vendor);

    } catch (error) {
        console.error(
            "Public vendor profile error:",
            error
        );

        mainContent.innerHTML = `
            <div class="vendor-profile-card">
                <h2>Vendor Not Found</h2>

                <p>
                    ${escapeHtml(error.message)}
                </p>

                <a
                    href="vendors.html"
                    class="view-profile-btn"
                >
                    Back to Directory
                </a>
            </div>
        `;
    }
}


// =====================================================
// RENDER PUBLIC VENDOR PROFILE
// =====================================================

function renderVendorProfile(vendor) {

    const mainContent = document.getElementById("mainContent");

    if (!mainContent) {
        console.error("mainContent not found.");
        return;
    }

    console.log("Vendor profile:", vendor);
    console.log("Shop details:", vendor.shopDetails);

    const shopDetails = vendor.shopDetails || {};

    const openingDays =
        Array.isArray(shopDetails.days)
            ? shopDetails.days
            : [];

    const closingDay =
        shopDetails.closingDay || "";

    const openingTime =
        shopDetails.openingTime || "";

    const closingTime =
        shopDetails.closingTime || "";

    const products =
        Array.isArray(shopDetails.products)
            ? shopDetails.products
            : [];


    /* =====================================================
       PRODUCTS
    ===================================================== */

    let productsHTML = "";

    if (products.length > 0) {

        productsHTML = products.map(product => {

            if (typeof product === "string") {

                return `
                    <div class="profile-product-item">

                        <div class="product-item-header">
                            <h4>
                                ${escapeHtml(product)}
                            </h4>
                            <span class="product-badge badge badge-success">
                                In Stock
                            </span>
                        </div>

                    </div>
                `;
            }

            const productName =
                product.name ||
                product.productName ||
                product.title ||
                "Product";

            const productDescription =
                product.description ||
                product.details ||
                "";

            const productPrice =
                product.price !== undefined &&
                product.price !== null &&
                product.price !== ""
                    ? product.price
                    : "";

            const statusText = String(product.status || "").trim().toLowerCase();
            const isOutOfStock =
                product.available === false ||
                statusText === "unavailable" ||
                statusText === "out of stock";
            const isAvailable = !isOutOfStock;

            const badgeHtml = isAvailable
                ? `<span class="product-badge badge badge-success">In Stock</span>`
                : `<span class="product-badge badge badge-danger">Out of Stock</span>`;

            return `
                <div class="profile-product-item ${isAvailable ? "" : "product-out-of-stock"}">

                    <div class="product-item-header">
                        <h4>
                            ${escapeHtml(productName)}
                        </h4>
                        ${badgeHtml}
                    </div>

                    ${
                        productDescription
                            ? `
                                <p>
                                    ${escapeHtml(productDescription)}
                                </p>
                              `
                            : ""
                    }

                    ${
                        productPrice
                            ? `
                                <strong>
                                    ₹${escapeHtml(productPrice)}
                                </strong>
                              `
                            : ""
                    }

                </div>
            `;

        }).join("");

    } else {

        productsHTML = `
            <p class="no-shop-data">
                No products added yet.
            </p>
        `;
    }


    /* =====================================================
       OPENING DAYS
    ===================================================== */

    let openingDaysHTML = "";

    if (openingDays.length > 0) {

        openingDaysHTML = openingDays
            .map(day => `
                <span class="day-badge">
                    ${escapeHtml(day)}
                </span>
            `)
            .join("");

    } else {

        openingDaysHTML = `
            <span class="no-shop-data">
                Not provided
            </span>
        `;
    }


    /* =====================================================
       RATING
    ===================================================== */

    const rating = vendor.rating || {};

    const averageRating =
        Number(rating.averageRating || 0).toFixed(1);

    const reviewCount =
        Number(rating.reviewCount || 0);


    /* =====================================================
       PROFILE HTML
    ===================================================== */

    mainContent.innerHTML = `

        <div class="vendor-profile-container">


            <!-- ==========================================
                 VENDOR DETAILS
            =========================================== -->

            <section class="vendor-profile-card">

                <h1>
                    ${escapeHtml(
                        vendor.businessName || "Vendor Profile"
                    )}
                </h1>

                <p class="vendor-category">
                    ${escapeHtml(vendor.category || "")}
                </p>


                <div class="vendor-profile-details">


                    <div class="profile-detail">

                        <strong>
                            Vendor ID
                        </strong>

                        <span>
                            ${escapeHtml(vendor.id || "N/A")}
                        </span>

                    </div>


                    <div class="profile-detail">

                        <strong>
                            Owner Name
                        </strong>

                        <span>
                            ${escapeHtml(vendor.name || "N/A")}
                        </span>

                    </div>


                    <div class="profile-detail">

                        <strong>
                            Mobile
                        </strong>

                        <span>
                            ${escapeHtml(vendor.mobile || "N/A")}
                        </span>

                    </div>


                    <div class="profile-detail">

                        <strong>
                            Email
                        </strong>

                        <span>
                            ${escapeHtml(vendor.email || "N/A")}
                        </span>

                    </div>


                    <div class="profile-detail">

                        <strong>
                            Category
                        </strong>

                        <span>
                            ${escapeHtml(vendor.category || "N/A")}
                        </span>

                    </div>


                    <div class="profile-detail">

                        <strong>
                            District
                        </strong>

                        <span>
                            ${escapeHtml(vendor.district || "N/A")}
                        </span>

                    </div>


                    <div class="profile-detail">

                        <strong>
                            Address
                        </strong>

                        <span>
                            ${escapeHtml(vendor.address || "N/A")}
                        </span>

                    </div>


                    <div class="profile-detail">

                        <strong>
                            Experience
                        </strong>

                        <span>
                            ${escapeHtml(vendor.years || "N/A")}
                            years
                        </span>

                    </div>


                </div>


                ${
                    vendor.description
                        ? `
                            <div class="vendor-description">

                                <h3>
                                    About Business
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        vendor.description
                                    )}
                                </p>

                            </div>
                          `
                        : ""
                }

            </section>



            <!-- ==========================================
                 SHOP DETAILS
            =========================================== -->

            <section class="shop-details-profile-card">

                <h2>
                    Shop Details
                </h2>


                <!-- OPENING DAYS -->

                <div class="shop-profile-section">

                    <h3>
                        Opening Days
                    </h3>

                    <div class="opening-days-list">

                        ${openingDaysHTML}

                    </div>

                </div>


                <!-- CLOSING DAY -->

                <div class="shop-profile-section">

                    <h3>
                        Closing Day
                    </h3>

                    <p>
                        ${
                            closingDay
                                ? escapeHtml(closingDay)
                                : "Not provided"
                        }
                    </p>

                </div>


                <!-- SHOP TIMINGS -->

                <div class="shop-profile-section">

                    <h3>
                        Shop Timings
                    </h3>


                    <div class="shop-timing-grid">


                        <div class="shop-time-box">

                            <strong>
                                Opening Time
                            </strong>

                            <span>
                                ${
                                    openingTime
                                        ? escapeHtml(openingTime)
                                        : "Not provided"
                                }
                            </span>

                        </div>


                        <div class="shop-time-box">

                            <strong>
                                Closing Time
                            </strong>

                            <span>
                                ${
                                    closingTime
                                        ? escapeHtml(closingTime)
                                        : "Not provided"
                                }
                            </span>

                        </div>


                    </div>

                </div>


                <!-- PRODUCTS -->

                <div class="shop-profile-section">

                    <h3>
                        Products
                    </h3>


                    <div class="profile-products">

                        ${productsHTML}

                    </div>

                </div>


            </section>



            <!-- ==========================================
                 RATING
            =========================================== -->

            <section class="vendor-rating-card">

                <h2>
                    Customer Rating
                </h2>


                <div class="rating-summary">

                    <span class="average-rating">
                        ⭐ ${averageRating}
                    </span>

                    <span>
                        ${reviewCount}
                        review${reviewCount === 1 ? "" : "s"}
                    </span>

                </div>


                <button
                    type="button"
                    class="rate-review-btn"
                    onclick="openReviewModal(
                        '${escapeHtml(vendor.id)}',
                        '${escapeHtml(
                            vendor.businessName || ""
                        )}'
                    )">

                    Rate & Review

                </button>

            </section>



            <!-- ==========================================
                 REVIEWS
            =========================================== -->

            <section class="vendor-reviews-section">

                <h2>
                    Customer Reviews
                </h2>


                <div id="vendorReviews">

                    <p>
                        Loading reviews...
                    </p>

                </div>

            </section>



            <!-- ==========================================
                 BACK
            =========================================== -->

            <div class="profile-back-container">

                <button
                    type="button"
                    class="back-to-directory-btn"
                    onclick="loadVendorDirectory()">

                    ← Back to Vendor Directory

                </button>

            </div>


        </div>
    `;


    /* Load reviews */

    if (vendor.id) {
        loadVendorReviews(vendor.id);
    }

}


// =====================================================
// LOAD VERIFIED VENDOR DIRECTORY
// =====================================================

let allDirectoryVendors = [];

function populateDirectoryFilters(vendors) {
    const categorySelect = document.getElementById("categoryFilter");
    const districtSelect = document.getElementById("districtFilter");

    if (categorySelect) {
        const currentCategory = categorySelect.value;
        const categories = Array.from(
            new Set(
                vendors
                    .map(v => (v.category || "").trim())
                    .filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b));

        categorySelect.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            if (cat === currentCategory) {
                opt.selected = true;
            }
            categorySelect.appendChild(opt);
        });
    }

    if (districtSelect) {
        const currentDistrict = districtSelect.value;
        const districts = Array.from(
            new Set(
                vendors
                    .map(v => (v.district || "").trim())
                    .filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b));

        districtSelect.innerHTML = '<option value="">All Districts</option>';
        districts.forEach(dist => {
            const opt = document.createElement("option");
            opt.value = dist;
            opt.textContent = dist;
            if (dist === currentDistrict) {
                opt.selected = true;
            }
            districtSelect.appendChild(opt);
        });
    }
}

function setupDirectoryFilters() {
    const searchInput = document.getElementById("searchVendor");
    const categorySelect = document.getElementById("categoryFilter");
    const districtSelect = document.getElementById("districtFilter");

    if (!searchInput || !categorySelect || !districtSelect) {
        return;
    }

    if (searchInput.dataset.filtersBound === "true") {
        return;
    }
    searchInput.dataset.filtersBound = "true";

    searchInput.addEventListener("input", debounce(filterAndRenderDirectory, 200));
    categorySelect.addEventListener("change", filterAndRenderDirectory);
    districtSelect.addEventListener("change", filterAndRenderDirectory);
}

function filterAndRenderDirectory() {
    const searchInput = document.getElementById("searchVendor");
    const categorySelect = document.getElementById("categoryFilter");
    const districtSelect = document.getElementById("districtFilter");
    const container =
        document.getElementById("vendorDirectory") ||
        document.querySelector(".vendor-grid");

    if (!container) {
        return;
    }

    const query = (searchInput?.value || "").trim().toLowerCase();
    const selectedCategory = (categorySelect?.value || "").trim().toLowerCase();
    const selectedDistrict = (districtSelect?.value || "").trim().toLowerCase();

    const filtered = allDirectoryVendors.filter(vendor => {
        const ownerName = String(vendor.name || "").toLowerCase();
        const businessName = String(vendor.businessName || "").toLowerCase();
        const category = String(vendor.category || "").trim().toLowerCase();
        const district = String(vendor.district || "").trim().toLowerCase();

        const matchesSearch =
            !query ||
            ownerName.includes(query) ||
            businessName.includes(query);

        const matchesCategory =
            !selectedCategory ||
            category === selectedCategory;

        const matchesDistrict =
            !selectedDistrict ||
            district === selectedDistrict;

        return matchesSearch && matchesCategory && matchesDistrict;
    });

    renderVendorCards(filtered, container);
}

function renderVendorCards(vendors, container) {
    if (!container) {
        return;
    }

    if (!Array.isArray(vendors) || vendors.length === 0) {
        container.innerHTML = `
            <div class="no-vendors" style="grid-column: 1 / -1;">
                <h2>No verified vendors found.</h2>
                <p>No vendors match your search and filter criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = vendors.map(vendor => {
        const rating = vendor.rating || {};
        const averageRating = Number(rating.averageRating || 0).toFixed(1);
        const reviewCount = Number(rating.reviewCount || 0);

        return `
            <div class="vendor-card">
                <h2>
                    ${escapeHtml(vendor.businessName || "Vendor Business")}
                </h2>

                <p>
                    <strong>Owner:</strong>
                    ${escapeHtml(vendor.name || "N/A")}
                </p>

                <p>
                    <strong>Category:</strong>
                    ${escapeHtml(vendor.category || "N/A")}
                </p>

                <p>
                    <strong>District:</strong>
                    ${escapeHtml(vendor.district || "N/A")}
                </p>

                <p class="vendor-card-rating">
                    ★ ${averageRating}
                    <span>(${reviewCount} reviews)</span>
                </p>

                <a
                    class="view-profile-btn"
                    href="vendors.html?id=${encodeURIComponent(vendor.id)}"
                >
                    View Profile
                </a>
            </div>
        `;
    }).join("");
}

function ensureDirectoryDOM() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) {
        return null;
    }

    let dirContainer = document.getElementById("vendorDirectory");
    let searchInput = document.getElementById("searchVendor");

    if (!dirContainer || !searchInput) {
        mainContent.innerHTML = `
            <section class="directory-page">

                <div class="directory-header">
                    <h1>Vendor Directory</h1>
                    <p>Explore verified street vendors.</p>
                </div>

                <div class="directory-filters vendor-filters">
                    <input
                        type="text"
                        id="searchVendor"
                        placeholder="Search vendor by name or business..."
                        aria-label="Search vendor by name or business"
                    >

                    <select id="categoryFilter" aria-label="Filter by category">
                        <option value="">All Categories</option>
                    </select>

                    <select id="districtFilter" aria-label="Filter by district">
                        <option value="">All Districts</option>
                    </select>
                </div>

                <div id="vendorDirectory" class="vendor-grid">
                    <p>Loading verified vendors...</p>
                </div>

            </section>
        `;
        dirContainer = document.getElementById("vendorDirectory");
    }

    return dirContainer;
}

async function loadVendorDirectory() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) {
        return;
    }

    if (window.location.search) {
        try {
            window.history.pushState({}, "", "vendors.html");
        } catch {
            // Ignore in restricted environments
        }
    }

    const dirContainer = ensureDirectoryDOM();

    try {
        const response = await fetch(`${API_BASE_URL}/public/vendors`);
        const vendors = await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                vendors.message || "Unable to load vendors."
            );
        }

        const verifiedVendors = Array.isArray(vendors)
            ? vendors.filter(v => !v.status || String(v.status).toLowerCase() === "verified")
            : [];

        await renderVendorDirectory(verifiedVendors);

    } catch (error) {
        console.error("Vendor directory error:", error);

        if (dirContainer) {
            dirContainer.innerHTML = `
                <div class="no-vendors" style="grid-column: 1 / -1;">
                    <h2>Unable to load vendors.</h2>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        } else {
            mainContent.innerHTML = `
                <section class="directory-page">
                    <div class="directory-header">
                        <h1>Vendor Directory</h1>
                        <p>Unable to load vendors.</p>
                        <p>${escapeHtml(error.message)}</p>
                    </div>
                </section>
            `;
        }
    }
}


// =====================================================
// GET VENDOR RATING
// =====================================================

async function getVendorRating(vendorId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/reviews/vendor/${encodeURIComponent(vendorId)}`
        );

        const result =
            await getResponseData(response);

        if (!response.ok) {
            return {
                averageRating: 0,
                reviewCount: 0
            };
        }

        return {
            averageRating:
                Number(
                    result.averageRating || 0
                ),

            reviewCount:
                Number(
                    result.reviewCount || 0
                )
        };

    } catch (error) {
        console.error(
            "Rating loading error:",
            error
        );

        return {
            averageRating: 0,
            reviewCount: 0
        };
    }
}


// =====================================================
// RENDER VENDOR DIRECTORY
// =====================================================

async function renderVendorDirectory(vendors) {
    const container = ensureDirectoryDOM();
    if (!container) {
        return;
    }

    if (!Array.isArray(vendors) || vendors.length === 0) {
        allDirectoryVendors = [];
        populateDirectoryFilters([]);
        setupDirectoryFilters();
        renderVendorCards([], container);
        return;
    }

    // Load ratings
    const vendorsWithRatings = await Promise.all(
        vendors.map(async vendor => {
            if (vendor.rating) {
                return vendor;
            }
            const rating = await getVendorRating(vendor.id);
            return {
                ...vendor,
                rating
            };
        })
    );

    allDirectoryVendors = vendorsWithRatings;

    populateDirectoryFilters(allDirectoryVendors);
    setupDirectoryFilters();
    filterAndRenderDirectory();
}


// =====================================================
// REVIEWS
// =====================================================

let selectedRating = 0;


// =====================================================
// OPEN REVIEW MODAL
// =====================================================

function openReviewModal(vendorId, vendorName) {
    const token = getCustomerReviewToken();
    const role = getCustomerReviewRole();

    if (!token || role !== "customer") {
        if (confirm("You need to log in with a customer account to rate and review vendors.\n\nWould you like to go to the Customer Login page now?")) {
            window.location.href = "../customer/login.html";
        }
        return;
    }

    const modal =
        document.getElementById("reviewModal");

    const vendorIdInput =
        document.getElementById("reviewVendorId");

    const vendorNameElement =
        document.getElementById("reviewVendorName");

    const reviewMessage =
        document.getElementById("reviewMessage");

    const reviewText =
        document.getElementById("reviewText");

    if (!modal) {
        console.error("Review modal not found.");
        return;
    }

    if (vendorIdInput) {
        vendorIdInput.value = vendorId;
    }

    if (vendorNameElement) {
        vendorNameElement.textContent = vendorName;
    }

    if (reviewMessage) {
        reviewMessage.textContent = "";
    }

    if (reviewText) {
        reviewText.value = "";
    }

    selectedRating = 0;

    updateStars();

    const selectedRatingElement =
        document.getElementById("selectedRating");

    if (selectedRatingElement) {
        selectedRatingElement.textContent =
            "Select your rating";
    }

    modal.style.display = "flex";
}


// =====================================================
// CLOSE REVIEW MODAL
// =====================================================

function closeReviewModal() {
    const modal =
        document.getElementById("reviewModal");

    if (modal) {
        modal.style.display = "none";
    }
}

window.closeReviewModal = closeReviewModal;
window.openReviewModal = openReviewModal;


// =====================================================
// SELECT RATING
// =====================================================

function selectRating(rating) {
    selectedRating = Number(rating);

    const selectedRatingElement =
        document.getElementById("selectedRating");

    if (selectedRatingElement) {
        selectedRatingElement.textContent =
            `${selectedRating} out of 5 stars`;
    }

    updateStars();
}


// =====================================================
// UPDATE STARS
// =====================================================

function updateStars() {
    const stars =
        document.querySelectorAll(
            ".rating-star"
        );

    stars.forEach(star => {
        const rating =
            Number(
                star.dataset.rating
            );

        star.classList.toggle(
            "selected",
            rating <= selectedRating
        );
    });
}


// =====================================================
// SUBMIT REVIEW
// =====================================================

// =====================================================
// SUBMIT REVIEW
// =====================================================

async function submitReview(event) {

    event.preventDefault();

    const messageElement =
        document.getElementById("reviewMessage");

    const vendorIdElement =
        document.getElementById("reviewVendorId");

    const reviewTextElement =
        document.getElementById("reviewText");


    if (!messageElement) {
        console.error(
            "reviewMessage element not found."
        );
        return;
    }


    if (!vendorIdElement) {

        messageElement.textContent =
            "Vendor ID field not found.";

        return;
    }


    if (!reviewTextElement) {

        messageElement.textContent =
            "Review field not found.";

        return;
    }


    const vendorId =
        vendorIdElement.value.trim();

    const reviewText =
        reviewTextElement.value.trim();

    const token = getCustomerReviewToken();
    const customerRole = getCustomerReviewRole();

    const rating =
        Number(selectedRating);


    console.log(
        "========== SUBMIT REVIEW =========="
    );

    console.log(
        "Vendor ID:",
        vendorId
    );

    console.log(
        "Rating:",
        rating
    );

    console.log(
        "Review:",
        reviewText
    );

    console.log(
        "Customer Role:",
        customerRole
    );

    console.log(
        "Customer Token Exists:",
        Boolean(token)
    );


    // =================================================
    // CUSTOMER LOGIN CHECK
    // =================================================

    if (!token) {
        messageElement.style.color = "#dc2626";
        messageElement.textContent =
            "Please login as a customer first.";
        alert("Please login as a customer to submit a review.");
        window.location.href = "../customer/login.html";
        return;
    }


    if (customerRole !== "customer") {
        messageElement.style.color = "#dc2626";
        messageElement.textContent =
            "Please login using a customer account.";
        alert("Only customer accounts can submit reviews.");
        return;
    }


    // =================================================
    // VENDOR CHECK
    // =================================================

    if (!vendorId) {

        messageElement.textContent =
            "Vendor ID is missing.";

        return;
    }


    // =================================================
    // RATING CHECK
    // =================================================

    if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {

        messageElement.textContent =
            "Please select a rating from 1 to 5.";

        return;
    }


    // =================================================
    // REVIEW CHECK
    // =================================================

    if (!reviewText) {

        messageElement.textContent =
            "Please write your review.";

        return;
    }


    try {

        messageElement.textContent =
            "Submitting review...";


        // =================================================
        // SEND REVIEW TO BACKEND
        // =================================================

        const response =
            await fetch(
                `${API_BASE_URL}/reviews`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        vendorId:
                            vendorId,

                        rating:
                            rating,

                        review:
                            reviewText
                    })
                }
            );


        const data =
            await getResponseData(response);


        console.log(
            "Review HTTP status:",
            response.status
        );

        console.log(
            "Review server response:",
            data
        );


        // =================================================
        // BACKEND ERROR
        // =================================================

        if (!response.ok) {

            throw new Error(
                data.message ||
                `Review submission failed (${response.status}).`
            );
        }


        // =================================================
        // SUCCESS
        // =================================================

        messageElement.textContent =
            "Review submitted successfully!";


        reviewTextElement.value = "";


        selectedRating = 0;


        updateStars();


        const selectedRatingElement =
            document.getElementById(
                "selectedRating"
            );


        if (selectedRatingElement) {

            selectedRatingElement.textContent =
                "Select your rating";
        }


        // =================================================
        // RELOAD REVIEWS
        // =================================================

        await loadVendorReviews(
            vendorId
        );


        // =================================================
        // RELOAD VENDOR PROFILE
        // This updates average rating + review count
        // =================================================

        setTimeout(async () => {

            const currentUrl =
                new URLSearchParams(
                    window.location.search
                );

            const currentVendorId =
                currentUrl.get("id");


            if (
                currentVendorId &&
                currentVendorId === vendorId
            ) {

                await loadPublicVendorProfile(
                    vendorId
                );

            }


            const modal =
                document.getElementById(
                    "reviewModal"
                );


            if (modal) {

                modal.style.display =
                    "none";
            }


            messageElement.textContent =
                "";

        }, 1000);


    } catch (error) {

        console.error(
            "========== REVIEW SUBMIT ERROR =========="
        );

        console.error(error);


        // fetch failed completely
        if (
            error instanceof TypeError
        ) {

            messageElement.textContent =
                "Unable to connect to server. Make sure backend is running on port 5000.";

            return;
        }


        // backend returned an error
        messageElement.textContent =
            error.message ||
            "Failed to submit review.";
    }
}

// =====================================================
// LOAD VENDOR REVIEWS
// =====================================================

async function loadVendorReviews(vendorId) {
    const reviewsContainer =
        document.getElementById(
            "vendorReviews"
        );

    if (!reviewsContainer) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/reviews/vendor/${encodeURIComponent(
                vendorId
            )}`
        );

        const result =
            await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                result.message ||
                "Unable to load reviews."
            );
        }

        const reviews =
            Array.isArray(result)
                ? result
                : Array.isArray(result.reviews)
                    ? result.reviews
                    : [];


        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <p class="no-products">
                    No reviews yet.
                </p>
            `;

            return;
        }


        reviewsContainer.innerHTML =
            reviews.map(review => {

                const rating =
                    Math.max(
                        0,
                        Math.min(
                            5,
                            Number(
                                review.rating || 0
                            )
                        )
                    );

                const stars =
                    "★".repeat(rating) +
                    "☆".repeat(5 - rating);

                return `
                    <div class="review-card">

                        <div class="review-header">

                            <strong>
                                ${escapeHtml(
                                    review.customerName ||
                                    "Customer"
                                )}
                            </strong>

                            <span>
                                ${stars}
                            </span>

                        </div>


                        <p>
                            ${escapeHtml(
                                review.review ||
                                review.comment ||
                                ""
                            )}
                        </p>

                    </div>
                `;

            }).join("");

    } catch (error) {
        console.error(
            "Review loading error:",
            error
        );

        reviewsContainer.innerHTML = `
            <p>
                Unable to load reviews.
            </p>
        `;
    }
}


// =====================================================
// INITIALIZATION
// =====================================================

function setupPasswordVisibilityToggle(toggleBtnId, inputId) {
    const toggleBtn =
        document.getElementById(toggleBtnId);

    const input =
        document.getElementById(inputId);

    if (toggleBtn && input) {
        toggleBtn.addEventListener(
            "click",
            function () {
                const isPassword =
                    input.type === "password";

                input.type =
                    isPassword ? "text" : "password";

                toggleBtn.setAttribute(
                    "aria-label",
                    isPassword
                        ? "Hide password"
                        : "Show password"
                );

                toggleBtn.setAttribute(
                    "title",
                    isPassword
                        ? "Hide password"
                        : "Show password"
                );

                toggleBtn.innerHTML = isPassword
                    ? `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
                    : `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // =================================================
        // VENDOR REGISTRATION
        // =================================================

        const vendorForm =
            document.getElementById(
                "vendorForm"
            );

        if (vendorForm) {
            setupPasswordVisibilityToggle(
                "toggleVendorPassword",
                "vendorPassword"
            );

            setupPasswordVisibilityToggle(
                "toggleConfirmPassword",
                "confirmPassword"
            );

            vendorForm.addEventListener(
                "submit",
                handleVendorRegistration
            );
        }


        // =================================================
        // VENDOR LOGIN
        // =================================================

        const vendorLoginForm =
            document.getElementById(
                "vendorLoginForm"
            );

        if (vendorLoginForm) {
            checkExistingVendorSession();

            setupPasswordVisibilityToggle(
                "toggleVendorPassword",
                "vendorPasswordLogin"
            );

            vendorLoginForm.addEventListener(
                "submit",
                handleVendorLogin
            );
        }


        // =================================================
        // REVIEW FORM
        // =================================================

        const reviewForm =
            document.getElementById(
                "reviewForm"
            );

        if (reviewForm) {
            reviewForm.addEventListener(
                "submit",
                submitReview
            );
        }


        // =================================================
        // REVIEW STAR BUTTONS
        // =================================================

        const ratingStars =
            document.querySelectorAll(
                ".rating-star"
            );

        ratingStars.forEach(star => {
            star.addEventListener(
                "click",
                function () {

                    selectRating(
                        Number(
                            this.dataset.rating
                        )
                    );

                }
            );
        });


        // =================================================
        // CLOSE MODAL BUTTON & OUTSIDE CLICK
        // =================================================

        const reviewModal =
            document.getElementById(
                "reviewModal"
            );

        const closeReviewModalBtn =
            document.getElementById(
                "closeReviewModal"
            );

        if (closeReviewModalBtn) {
            closeReviewModalBtn.addEventListener(
                "click",
                closeReviewModal
            );
        }

        if (reviewModal) {
            reviewModal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        reviewModal
                    ) {
                        closeReviewModal();
                    }

                }
            );
        }

        document.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Escape" &&
                    reviewModal &&
                    reviewModal.style.display === "flex"
                ) {
                    closeReviewModal();
                }
            }
        );


        // =================================================
        // DIRECTORY / PROFILE
        // =================================================

        const mainContent =
            document.getElementById(
                "mainContent"
            );

        if (mainContent) {

            const params =
                new URLSearchParams(
                    window.location.search
                );

            const vendorId =
                params.get("id");

            if (vendorId) {

                // Open single vendor profile
                loadPublicVendorProfile(
                    vendorId
                );

            } else {

                // Open vendor directory
                loadVendorDirectory();
            }
        }


        // =================================================
        // CUSTOMER DIRECTORY NAVBAR
        // =================================================

        const customerDirectory =
            document.getElementById(
                "customerVendorDirectory"
            );

        const customerToken = getCustomerReviewToken();
        const customerRole = getCustomerReviewRole();

        if (
            customerDirectory &&
            customerToken &&
            customerRole === "customer"
        ) {
            customerDirectory.style.display =
                "list-item";
        }

    }
);