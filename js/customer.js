// =====================================================
// STREET VENDOR MANAGEMENT SYSTEM - CUSTOMER MODULE
// =====================================================

const API_BASE_URL = window.APP_CONFIG.API_BASE_URL;

// Utility: HTML Escaping for XSS prevention
function escapeHtml(str) {
    if (str === null || str === undefined) return "";

    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// Utility: Debounce for performance optimization
function debounce(func, delay = 250) {

    let timeoutId;

    return function (...args) {

        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);

    };
}


// Standardized Authentication Storage Keys
const AUTH_TOKEN_KEY = "authToken";
const USER_ROLE_KEY = "userRole";
const USER_ID_KEY = "userId";
const USER_NAME_KEY = "userName";

// Backward-compatible getters
function getCustomerAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem("customerToken");
}

function getCustomerAuthRole() {
    return localStorage.getItem(USER_ROLE_KEY) || localStorage.getItem("customerRole");
}

function getCustomerAuthId() {
    return localStorage.getItem(USER_ID_KEY) || localStorage.getItem("customerId");
}

function getCustomerAuthName() {
    return localStorage.getItem(USER_NAME_KEY) || localStorage.getItem("customerName");
}

function clearCustomerAuth() {
    const activeRole = localStorage.getItem(USER_ROLE_KEY) || localStorage.getItem("customerRole");
    if (activeRole !== "vendor" && activeRole !== "admin") {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        localStorage.removeItem(USER_ID_KEY);
        localStorage.removeItem(USER_NAME_KEY);
    }
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerRole");
    localStorage.removeItem("customerId");
    localStorage.removeItem("customerName");
    localStorage.removeItem("showVendorDirectory");
}

// Utility: Safely parse JSON response
async function parseJsonResponse(response) {
    try {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (err) {
        console.warn("Failed to parse JSON response:", err);
        return null;
    }
}



// =====================================================
// CUSTOMER REGISTRATION
// =====================================================

const customerRegisterForm =
    document.getElementById("customerRegisterForm");


if (customerRegisterForm) {

    customerRegisterForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("customerName")
                    .value
                    .trim();


            const mobile =
                document
                    .getElementById("customerMobile")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("customerEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("customerPassword")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            const message =
                document.getElementById(
                    "customerRegisterMessage"
                );


            // Check password

            if (password !== confirmPassword) {

                message.textContent =
                    "Passwords do not match.";

                message.style.color =
                    "red";

                return;
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/customers`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                mobile: mobile,
                                email: email,
                                password: password,
                                confirmPassword: confirmPassword
                            })
                        }
                    );


                const data =
                    await response.json();


               if (response.ok) {

    console.log("Customer registration response:", data);

    const customerId =
        data.customer?.id ||
        data.customerId ||
        data.id;

    message.textContent =
        "Registration successful! Customer ID: " +
        customerId;

    message.style.color =
        "green";


                    customerRegisterForm.reset();


                    setTimeout(function () {

                        window.location.href =
                            "login.html";

                    }, 2000);

                } else {

                    message.textContent =
                        data.message ||
                        "Registration failed.";

                    message.style.color =
                        "red";
                }


            } catch (error) {

                console.error(error);


                if (message) {

                    if (!navigator.onLine) {

                        message.textContent =
                            "You appear to be offline. Please check your internet connection.";

                    } else {

                        message.textContent =
                            "Cannot connect to backend server. Please verify the server is running.";
                    }

                    message.style.color =
                        "red";
                }
            }
        }
    );
}



// =====================================================
// CUSTOMER LOGIN
// =====================================================

function setCustomerLoginMessage(messageElement, text, type) {
    if (!messageElement) return;
    messageElement.textContent = text || "";
    messageElement.classList.remove("status-message-success", "status-message-error");
    if (type === "success") {
        messageElement.classList.add("status-message-success");
    } else if (type === "error") {
        messageElement.classList.add("status-message-error");
    }
}

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

                const label = isPassword
                    ? "Hide password"
                    : "Show password";

                toggleBtn.setAttribute(
                    "aria-label",
                    label
                );

                toggleBtn.setAttribute(
                    "title",
                    label
                );

                toggleBtn.innerHTML = isPassword
                    ? `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
                    : `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        );
    }
}

async function checkExistingCustomerSession() {
    const token = getCustomerAuthToken();
    const role = getCustomerAuthRole();
    const customerId = getCustomerAuthId();

    if (!token) {
        return;
    }

    if (role === "vendor" || role === "admin") {
        return;
    }

    let payload = null;
    try {
        const parts = token.split(".");
        if (parts.length === 3) {
            const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            payload = JSON.parse(jsonPayload);
        }
    } catch {
        payload = null;
    }

    if (!payload || (payload.exp && payload.exp * 1000 <= Date.now()) || payload.role !== "customer") {
        clearCustomerAuth();
        return;
    }

    const effectiveCustomerId = customerId || payload.id;
    if (!effectiveCustomerId) {
        clearCustomerAuth();
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/customers/${encodeURIComponent(effectiveCustomerId)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            if (data && (data.customer || data.id)) {
                window.location.replace("dashboard.html");
            }
        } else if (response.status === 401 || response.status === 403 || response.status === 404) {
            clearCustomerAuth();
        }
    } catch (error) {
        console.warn("Backend unavailable while validating existing session:", error);
    }
}

const customerLoginForm =
    document.getElementById(
        "customerLoginForm"
    );


if (customerLoginForm) {
    checkExistingCustomerSession();

    setupPasswordVisibilityToggle(
        "toggleCustomerPassword",
        "customerLoginPassword"
    );

    customerLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const submitBtn =
                customerLoginForm.querySelector(
                    'button[type="submit"]'
                );

            if (submitBtn && submitBtn.disabled) {
                return;
            }

            const loginId =
                document
                    .getElementById(
                        "customerLoginId"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "customerLoginPassword"
                    )
                    .value;


            const message =
                document.getElementById(
                    "customerLoginMessage"
                );

            setCustomerLoginMessage(message, "", "");

            const originalBtnText =
                submitBtn ? submitBtn.textContent : "Login";

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = "Logging in...";
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/customers/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                loginId: loginId,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (response.ok) {
                    const token = data.token;
                    const role = data.role || "customer";
                    const id = (data.customer && data.customer.id) || data.id;
                    const name = (data.customer && data.customer.name) || data.name || "Customer";

                    // Standardized authentication keys
                    localStorage.setItem(AUTH_TOKEN_KEY, token);
                    localStorage.setItem(USER_ROLE_KEY, role);
                    localStorage.setItem(USER_ID_KEY, id);
                    localStorage.setItem(USER_NAME_KEY, name);

                    // Backward-compatible keys
                    localStorage.setItem("customerToken", token);
                    localStorage.setItem("customerRole", role);
                    localStorage.setItem("customerId", id);
                    localStorage.setItem("customerName", name);

                    // Show Vendor Directory only for logged-in customers
                    localStorage.setItem("showVendorDirectory", "true");

                    setCustomerLoginMessage(
                        message,
                        "Login successful!",
                        "success"
                    );


                    // Redirect to customer dashboard

                    setTimeout(function () {

                        window.location.href =
                            "dashboard.html";

                    }, 500);


                } else {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }

                    setCustomerLoginMessage(
                        message,
                        data.message || "Invalid email/mobile or password.",
                        "error"
                    );
                }


            } catch (error) {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }

                console.error(error);

                setCustomerLoginMessage(
                    message,
                    "Cannot connect to backend server.",
                    "error"
                );
            }
        }
    );
}



// =====================================================
// CUSTOMER DASHBOARD
// =====================================================

const customerDashboard =
    document.querySelector(
        ".customer-dashboard"
    );


if (customerDashboard) {
    const token = getCustomerAuthToken();
    const role = getCustomerAuthRole();
    const customerId = getCustomerAuthId();

    // Check customer login
    if (!token || role !== "customer" || !customerId) {
        alert("Please login as a customer first.");
        if (role !== "vendor" && role !== "admin") {
            clearCustomerAuth();
        }
        window.location.href = "login.html";
    } else {
        // Load customer profile
        loadCustomerProfile(customerId, token);

        // Load verified vendors
        loadVerifiedVendors();

        // Setup dashboard navigation & active state
        setupCustomerDashboardNavigation();
    }
}


// =====================================================
// DASHBOARD SIDEBAR NAVIGATION & ACTIVE STATE
// =====================================================

function setupCustomerDashboardNavigation() {
    const navLinks = document.querySelectorAll("#dashSidebar .dash-nav .dash-link");
    if (!navLinks.length) return;

    function setActiveSection(targetSection) {
        let matched = false;
        navLinks.forEach(link => {
            const section = link.getAttribute("data-section") || link.getAttribute("href")?.replace(/^#/, "");
            if (section && section === targetSection) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
                matched = true;
            } else {
                link.classList.remove("active");
                link.removeAttribute("aria-current");
            }
        });

        // Default to overview if no section matched
        if (!matched && (!targetSection || targetSection === "top" || targetSection === "overview")) {
            navLinks.forEach(link => {
                const section = link.getAttribute("data-section");
                if (section === "overview") {
                    link.classList.add("active");
                    link.setAttribute("aria-current", "page");
                }
            });
        }
    }

    navLinks.forEach(link => {
        link.addEventListener("click", function () {
            const target = this.getAttribute("data-section") || this.getAttribute("href")?.replace(/^#/, "");
            if (target) {
                setActiveSection(target);
            }
        });
    });

    function syncFromHash() {
        const hash = window.location.hash.replace(/^#/, "");
        if (hash) {
            setActiveSection(hash);
        } else {
            setActiveSection("overview");
        }
    }

    window.addEventListener("hashchange", syncFromHash);
    syncFromHash();
}



// =====================================================
// LOAD CUSTOMER PROFILE
// =====================================================

async function loadCustomerProfile(
    customerId,
    token
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/customers/${customerId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


      if (!response.ok) {
    console.error(
        "Customer profile error:",
        data
    );

    // Token expired or invalid: log the user out cleanly
    if (response.status === 401 || response.status === 403) {
        clearCustomerAuth();
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerRole");
        localStorage.removeItem("customerId");
        window.location.href = "login.html";
    }
    return;
}


        // Customer ID

        const idElement =
            document.getElementById(
                "customerId"
            );


        if (idElement) {

            idElement.textContent =
                data.id || "-";
        }


        // Profile name, welcome name, header name and avatar

        const rawName =
            typeof data.name === "string"
                ? data.name.trim()
                : "";

        const displayName =
            rawName || "Customer";

        const initial =
            rawName
                ? rawName.charAt(0).toUpperCase()
                : "C";

        const profileName =
            document.getElementById(
                "profileName"
            );

        if (profileName) {
            profileName.textContent =
                rawName || "-";
        }

        const welcomeName =
            document.getElementById(
                "customerName"
            );

        if (welcomeName) {
            welcomeName.textContent =
                displayName;
        }

        const dashUserName =
            document.getElementById(
                "dashUserName"
            );

        if (dashUserName) {
            dashUserName.textContent =
                displayName;
        }

        const dashAvatar =
            document.getElementById(
                "dashAvatar"
            );

        if (dashAvatar) {
            dashAvatar.textContent =
                initial;
        }


        // Email

        const profileEmail =
            document.getElementById(
                "profileEmail"
            );


        if (profileEmail) {

            profileEmail.textContent =
                data.email || "-";
        }


        // Mobile Number

        const profileMobile =
            document.getElementById(
                "profileMobile"
            );

        if (profileMobile) {

            profileMobile.textContent =
                (typeof data.mobile === "string" && data.mobile.trim())
                    ? data.mobile.trim()
                    : "-";
        }


    } catch (error) {

        console.error(
            "Error loading customer profile:",
            error
        );
    }
}



// =====================================================
// LOAD VERIFIED VENDORS
// =====================================================

let allVerifiedVendors = [];


async function loadVerifiedVendors() {

    const vendorList =
        document.getElementById(
            "vendorList"
        );


    if (!vendorList) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/public/vendors`
            );


        const vendors =
            await response.json();


        if (!response.ok) {

            vendorList.innerHTML =
                "<p>Unable to load vendors.</p>";

            return;
        }


        // Store vendors for filtering

        allVerifiedVendors =
            vendors;


        // Populate district filter

        populateDistrictFilter(
            vendors
        );


        // Setup filters

        setupVendorFilters();


        // Display vendors

        applyVendorFilters();


    } catch (error) {

        console.error(
            "Error loading vendors:",
            error
        );


        if (vendorList) {

            vendorList.innerHTML =
                "<p>Unable to connect to backend server. Please verify the server is running.</p>";
        }
    }
}



// =====================================================
// POPULATE DISTRICT FILTER
// =====================================================

function populateDistrictFilter(
    vendors
) {

    const districtFilter =
        document.getElementById(
            "districtFilter"
        );


    if (!districtFilter) {
        return;
    }


    districtFilter.innerHTML =
        '<option value="">All Districts</option>';


    const districts =
        [
            ...new Set(
                vendors
                    .map(function (vendor) {

                        return vendor.district;

                    })
                    .filter(function (district) {

                        return district;

                    })
            )
        ];


    districts.sort();


    districts.forEach(
        function (district) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                district;


            option.textContent =
                district;


            districtFilter.appendChild(
                option
            );
        }
    );
}



// =====================================================
// VENDOR FILTERS
// =====================================================

function setupVendorFilters() {

    const searchInput =
        document.getElementById(
            "vendorSearch"
        );


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const districtFilter =
        document.getElementById(
            "districtFilter"
        );


    if (
        !searchInput ||
        !categoryFilter ||
        !districtFilter
    ) {

        return;
    }


    if (
        searchInput.dataset.filtersInitialized ===
        "true"
    ) {

        return;
    }


    searchInput.dataset.filtersInitialized =
        "true";


    // Search vendor by name

    searchInput.addEventListener(
        "input",
        debounce(
            applyVendorFilters,
            200
        )
    );


    // Category filter

    categoryFilter.addEventListener(
        "change",
        applyVendorFilters
    );


    // District filter

    districtFilter.addEventListener(
        "change",
        applyVendorFilters
    );


    // Clear filters button

    const clearFiltersBtn =
        document.getElementById(
            "clearFilters"
        );

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener(
            "click",
            function () {
                searchInput.value = "";
                categoryFilter.value = "";
                districtFilter.value = "";
                applyVendorFilters();
            }
        );
    }
}



// =====================================================
// APPLY VENDOR FILTERS
// =====================================================

function applyVendorFilters() {

    const searchInput =
        document.getElementById(
            "vendorSearch"
        );


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const districtFilter =
        document.getElementById(
            "districtFilter"
        );


    if (
        !searchInput ||
        !categoryFilter ||
        !districtFilter
    ) {

        return;
    }


    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedCategory =
        categoryFilter.value
            .trim()
            .toLowerCase();


    const selectedDistrict =
        districtFilter.value
            .trim()
            .toLowerCase();


    const filteredVendors =
        allVerifiedVendors.filter(
            function (vendor) {

                const vendorName =
                    String(
                        vendor.name || ""
                    ).toLowerCase();

                const businessName =
                    String(
                        vendor.businessName || ""
                    ).toLowerCase();

                const vendorCategory =
                    String(
                        vendor.category || ""
                    ).toLowerCase();

                const vendorDistrict =
                    String(
                        vendor.district || ""
                    ).toLowerCase();

                const matchesSearch =
                    !searchText ||
                    vendorName.includes(
                        searchText
                    ) ||
                    businessName.includes(
                        searchText
                    );

                const matchesCategory =
                    !selectedCategory ||
                    vendorCategory ===
                    selectedCategory;

                const matchesDistrict =
                    !selectedDistrict ||
                    vendorDistrict ===
                    selectedDistrict;

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesDistrict
                );
            }
        );


    displayVendors(
        filteredVendors
    );
}



// =====================================================
// GET VENDOR RATING
// =====================================================

async function getVendorRating(
    vendorId
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/reviews/vendor/${encodeURIComponent(vendorId)}`
            );


        if (!response.ok) {

            return {
                averageRating: 0,
                reviewCount: 0,
                reviews: []
            };
        }


        const data =
            await response.json();


        return data;


    } catch (error) {

        console.error(
            "Error loading vendor rating:",
            error
        );


        return {
            averageRating: 0,
            reviewCount: 0,
            reviews: []
        };
    }
}



// =====================================================
// DISPLAY VERIFIED VENDORS
// =====================================================

function displayVendors(
    vendors
) {

    const vendorList =
        document.getElementById(
            "vendorList"
        );


    if (!vendorList) {
        return;
    }


    vendorList.innerHTML = "";


    if (
        !vendors ||
        vendors.length === 0
    ) {

        vendorList.innerHTML =
            "<p>No vendors found matching your filters.</p>";

        return;
    }


    const fragment =
        document.createDocumentFragment();


    vendors.forEach(
        function (vendor) {

            // -------------------------------------------------
            // Create elements
            // -------------------------------------------------

            const card =
                document.createElement(
                    "div"
                );


            const badge =
                document.createElement(
                    "span"
                );


            const heading =
                document.createElement(
                    "h3"
                );


            const rating =
                document.createElement(
                    "p"
                );


            const buttonContainer =
                document.createElement(
                    "div"
                );


            const profileButton =
                document.createElement(
                    "button"
                );


            const reviewsButton =
                document.createElement(
                    "button"
                );


            const reviewButton =
                document.createElement(
                    "button"
                );


            // -------------------------------------------------
            // Card
            // -------------------------------------------------

            card.className =
                "vendor-card";


            // -------------------------------------------------
            // Verified Badge
            // -------------------------------------------------

            badge.className =
                "verified-badge";


            badge.textContent =
                "✓ Verified Vendor";


            // -------------------------------------------------
            // Business Name
            // -------------------------------------------------

            heading.textContent =
                vendor.businessName ||
                "Business";


            // -------------------------------------------------
            // Rating
            // -------------------------------------------------

            rating.className =
                "vendor-rating";


            rating.textContent =
                "Loading rating...";


            // -------------------------------------------------
            // Existing Vendor Details
            // -------------------------------------------------

            addVendorDetail(
                card,
                "Owner",
                vendor.name
            );


            addVendorDetail(
                card,
                "Category",
                vendor.category
            );


            addVendorDetail(
                card,
                "Mobile",
                vendor.mobile
            );


            addVendorDetail(
                card,
                "District",
                vendor.district
            );


            addVendorDetail(
                card,
                "Address",
                vendor.address
            );


            // -------------------------------------------------
            // Button Container
            // -------------------------------------------------

            buttonContainer.className =
                "vendor-action-buttons";


            // -------------------------------------------------
            // VIEW PROFILE BUTTON
            // -------------------------------------------------

            profileButton.type =
                "button";


            profileButton.className =
                "view-profile-btn";


            profileButton.textContent =
                "View Profile";


profileButton.addEventListener(
    "click",
    function () {

        if (!vendor.id) {
            return;
        }

        window.location.href =
            `../directory/vendors.html?id=${encodeURIComponent(vendor.id)}`;

    }
);


            // -------------------------------------------------
            // VIEW REVIEWS BUTTON
            // -------------------------------------------------

            reviewsButton.type =
                "button";


            reviewsButton.className =
                "view-reviews-btn";


            reviewsButton.textContent =
                "View Reviews";


            reviewsButton.addEventListener(
                "click",
                async function () {

                    if (!vendor.id) {
                        return;
                    }


                    await showVendorReviews(
                        vendor.id,
                        vendor.businessName ||
                        vendor.name ||
                        "Vendor"
                    );

                }
            );


            // -------------------------------------------------
            // RATE & REVIEW BUTTON
            // -------------------------------------------------

            reviewButton.type =
                "button";


            reviewButton.className =
                "submit-review-btn";


            reviewButton.textContent =
                "Rate & Review";


            reviewButton.addEventListener(
                "click",
                function () {

                    openCustomerReviewModal(
                        vendor.id,
                        vendor.businessName ||
                        vendor.name ||
                        "Vendor"
                    );

                }
            );


            // -------------------------------------------------
            // Add Buttons
            // -------------------------------------------------

            buttonContainer.append(
                profileButton,
                reviewsButton,
                reviewButton
            );


            // -------------------------------------------------
            // Add Card Content
            // -------------------------------------------------

            card.prepend(
                badge,
                heading
            );


            card.append(
                rating,
                buttonContainer
            );


            fragment.appendChild(
                card
            );


            // -------------------------------------------------
            // Load Rating
            // -------------------------------------------------

            if (vendor.id) {

                getVendorRating(
                    vendor.id
                ).then(
                    function (ratingData) {

                        if (
                            ratingData &&
                            ratingData.reviewCount > 0
                        ) {

                            rating.textContent =
                                `Rating: ${ratingData.averageRating}/5 ` +
                                `(${ratingData.reviewCount} review` +
                                `${ratingData.reviewCount === 1 ? "" : "s"})`;

                        } else {

                            rating.textContent =
                                "No ratings yet";
                        }
                    }
                );

            } else {

                rating.textContent =
                    "No ratings yet";


                profileButton.disabled =
                    true;


                reviewsButton.disabled =
                    true;


                reviewButton.disabled =
                    true;
            }

        }
    );


    vendorList.appendChild(
        fragment
    );
}



// =====================================================
// ADD VENDOR DETAIL
// =====================================================

function addVendorDetail(
    card,
    label,
    value
) {

    const detail =
        document.createElement(
            "p"
        );


    const labelElement =
        document.createElement(
            "strong"
        );


    labelElement.textContent =
        `${label}: `;


    detail.append(
        labelElement,
        document.createTextNode(
            value || "N/A"
        )
    );


    card.appendChild(
        detail
    );
}



// =====================================================
// VIEW VENDOR REVIEWS
// =====================================================

function closeVendorReviewsModal() {
    const existing = document.getElementById("vendorReviewsModal");

    if (existing) {
        existing.remove();
    }

    document.removeEventListener("keydown", closeReviewsOnEscape);
    document.body.classList.remove("reviews-modal-open");
}

function closeReviewsOnEscape(event) {
    if (event.key === "Escape") {
        closeVendorReviewsModal();
    }
}

function createReviewsElement(tag, className, text) {
    const node = document.createElement(tag);

    if (className) {
        node.className = className;
    }

    if (text !== undefined) {
        node.textContent = text;
    }

    return node;
}

function buildStars(rating) {
    const count = Math.max(
        0,
        Math.min(5, Math.round(Number(rating) || 0))
    );

    return "★".repeat(count) + "☆".repeat(5 - count);
}

function openVendorReviewsModal(vendorName) {
    closeVendorReviewsModal();

    const overlay = createReviewsElement("div", "vreviews-overlay");
    overlay.id = "vendorReviewsModal";

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            closeVendorReviewsModal();
        }
    });

    const dialog = createReviewsElement("div", "vreviews-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "vendorReviewsTitle");

    const closeButton = createReviewsElement("button", "vreviews-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close reviews");
    closeButton.addEventListener("click", closeVendorReviewsModal);

    const title = createReviewsElement(
        "h2",
        "vreviews-title",
        vendorName ? "Reviews for " + vendorName : "Reviews"
    );
    title.id = "vendorReviewsTitle";

    const summary = createReviewsElement("p", "vreviews-summary", "");
    const list = createReviewsElement("div", "vreviews-list");

    list.appendChild(
        createReviewsElement("p", "vreviews-message", "Loading reviews...")
    );

    dialog.appendChild(closeButton);
    dialog.appendChild(title);
    dialog.appendChild(summary);
    dialog.appendChild(list);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    document.body.classList.add("reviews-modal-open");
    document.addEventListener("keydown", closeReviewsOnEscape);
    closeButton.focus();

    return { summary: summary, list: list };
}

async function showVendorReviews(
    vendorId,
    vendorName
) {
    const view = openVendorReviewsModal(vendorName);

    function showMessage(text) {
        view.list.replaceChildren(
            createReviewsElement("p", "vreviews-message", text)
        );
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/reviews/vendor/${encodeURIComponent(vendorId)}`
        );

        const data = await parseJsonResponse(response);

        if (!response.ok) {
            showMessage(
                (data && data.message) || "Unable to load reviews."
            );
            return;
        }

        const reviews = (data && data.reviews) || [];

        if (reviews.length === 0) {
            view.summary.textContent = "No ratings yet";
            showMessage("No reviews available yet.");
            return;
        }

        const average = Number(data.averageRating) || 0;
        const total = data.reviewCount || reviews.length;

        view.summary.textContent =
            buildStars(average) + "  " + average.toFixed(1) + " / 5  -  " +
            total + (total === 1 ? " review" : " reviews");

        view.list.replaceChildren();

        reviews.forEach(function (item) {
            const card = createReviewsElement("article", "vreviews-item");
            const header = createReviewsElement("div", "vreviews-item-head");

            header.appendChild(
                createReviewsElement(
                    "strong",
                    "vreviews-name",
                    item.customerName || item.name || "Customer"
                )
            );

            const stars = createReviewsElement(
                "span",
                "vreviews-stars",
                buildStars(item.rating)
            );
            stars.setAttribute(
                "aria-label",
                "Rated " + (Number(item.rating) || 0) + " out of 5"
            );
            header.appendChild(stars);

            card.appendChild(header);
            card.appendChild(
                createReviewsElement(
                    "p",
                    "vreviews-text",
                    item.review || "No review text."
                )
            );

            view.list.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading vendor reviews:", error);
        showMessage("Unable to load vendor reviews.");
    }
}

// =====================================================
// CUSTOMER REVIEW MODAL
// =====================================================

let selectedCustomerRating = 0;



function setCustomerReviewMessage(text, type) {
    const msgEl = document.getElementById("customerReviewMessage");
    if (!msgEl) return;
    if (!text) {
        msgEl.textContent = "";
        msgEl.className = "customer-review-message";
        msgEl.style.display = "none";
        return;
    }
    msgEl.textContent = text;
    msgEl.className = "customer-review-message " + (type === "success" ? "status-message-success" : "status-message-error");
    msgEl.style.display = "block";
}

function openCustomerReviewModal(
    vendorId,
    vendorName
) {

    const modal =
        document.getElementById(
            "customerReviewModal"
        );


    const vendorIdInput =
        document.getElementById(
            "customerReviewVendorId"
        );


    const vendorNameElement =
        document.getElementById(
            "customerReviewVendorName"
        );


    const reviewText =
        document.getElementById(
            "customerReviewText"
        );


    if (
        !modal ||
        !vendorIdInput ||
        !vendorNameElement ||
        !reviewText ||
        !vendorId
    ) {

        return;
    }


    vendorIdInput.value =
        vendorId;


    vendorNameElement.textContent =
        `Rate ${vendorName}`;


    reviewText.value =
        "";


    selectCustomerRating(0);

    setCustomerReviewMessage("", "");


    modal.style.display =
        "flex";
}



function closeCustomerReviewModal() {

    const modal =
        document.getElementById(
            "customerReviewModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }

    setCustomerReviewMessage("", "");
}



function selectCustomerRating(
    rating
) {

    selectedCustomerRating =
        rating;


    const stars =
        document.querySelectorAll(
            "#customerStarRating button"
        );


    const selectedRatingText =
        document.getElementById(
            "customerSelectedRating"
        );


    stars.forEach(
        function (star, index) {

            star.classList.toggle(
                "selected",
                index < rating
            );
        }
    );


    if (selectedRatingText) {

        selectedRatingText.textContent =
            rating
                ? `Selected rating: ${rating} of 5`
                : "Select your rating";
    }
}



window.openCustomerReviewModal =
    openCustomerReviewModal;


window.closeCustomerReviewModal =
    closeCustomerReviewModal;


window.selectCustomerRating =
    selectCustomerRating;



// =====================================================
// CUSTOMER REVIEW SUBMISSION
// =====================================================

const customerReviewForm =
    document.getElementById(
        "customerReviewForm"
    );


if (customerReviewForm) {

    customerReviewForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const token = getCustomerAuthToken();


            const vendorId =
                document.getElementById(
                    "customerReviewVendorId"
                ).value;


            const review =
                document.getElementById(
                    "customerReviewText"
                ).value.trim();


            const submitButton =
                customerReviewForm.querySelector(
                    "button[type='submit']"
                );


            setCustomerReviewMessage("", "");


            if (!token) {

                setCustomerReviewMessage(
                    "Your session has expired. Please log in again.",
                    "error"
                );


                setTimeout(function () {
                    window.location.href =
                        "login.html";
                }, 1500);


                return;
            }


            if (!selectedCustomerRating) {

                setCustomerReviewMessage(
                    "Please select a rating from 1 to 5 stars.",
                    "error"
                );

                return;
            }


            if (!review) {

                setCustomerReviewMessage(
                    "Please enter your review text.",
                    "error"
                );

                return;
            }


            if (submitButton) {

                submitButton.disabled =
                    true;
            }


            try {

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
                                    selectedCustomerRating,

                                review:
                                    review
                            })
                        }
                    );


                const result =
                    await parseJsonResponse(
                        response
                    );


                if (!response.ok) {

                    throw new Error(
                        (
                            result &&
                            result.message
                        ) ||
                        "Unable to submit your review."
                    );
                }


                setCustomerReviewMessage(
                    "Thank you! Your review has been submitted successfully.",
                    "success"
                );


                loadVerifiedVendors();


                setTimeout(function () {
                    closeCustomerReviewModal();
                }, 1200);


            } catch (error) {

                console.error(
                    "Review submission error:",
                    error
                );


                setCustomerReviewMessage(
                    error.message ||
                    "Unable to submit your review.",
                    "error"
                );


            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;
                }
            }
        }
    );
}

const customerReviewModalEl =
    document.getElementById(
        "customerReviewModal"
    );

if (customerReviewModalEl) {
    customerReviewModalEl.addEventListener(
        "click",
        function (event) {
            if (event.target === customerReviewModalEl) {
                closeCustomerReviewModal();
            }
        }
    );
}

document.addEventListener(
    "keydown",
    function (event) {
        if (
            event.key === "Escape" &&
            customerReviewModalEl &&
            customerReviewModalEl.style.display === "flex"
        ) {
            closeCustomerReviewModal();
        }
    }
);

// =====================================================
// CUSTOMER LOGOUT & SESSION MANAGEMENT
// =====================================================

const customerLogout =
    document.getElementById(
        "customerLogout"
    );


if (customerLogout) {
    customerLogout.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            clearCustomerAuth();
            localStorage.removeItem("showVendorDirectory");
            window.location.href = "../index.html";
        }
    );
}