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
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerRole");
    localStorage.removeItem("customerId");
    localStorage.removeItem("customerName");
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
                                password: password
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

const customerLoginForm =
    document.getElementById(
        "customerLoginForm"
    );


if (customerLoginForm) {

    customerLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


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


            try {

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


                console.log(
                    "Customer login response:",
                    data
                );


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
                    message.textContent = "Login successful!";
                    message.style.color = "green";


                    // Redirect to customer dashboard

                    setTimeout(function () {

                        window.location.href =
                            "dashboard.html";

                    }, 500);


                } else {

                    message.textContent =
                        data.message ||
                        "Invalid email/mobile or password.";

                    message.style.color =
                        "red";
                }


            } catch (error) {

                console.error(error);

                message.textContent =
                    "Cannot connect to backend server.";

                message.style.color =
                    "red";
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
        clearCustomerAuth();
        window.location.href = "login.html";
    } else {
        // Load customer profile
        loadCustomerProfile(customerId, token);

        // Load verified vendors
        loadVerifiedVendors();
    }
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


        // Profile name

        const profileName =
            document.getElementById(
                "profileName"
            );


        if (profileName) {

            profileName.textContent =
                data.name || "-";
        }


        // Welcome name

        const welcomeName =
            document.getElementById(
                "customerName"
            );


        if (welcomeName) {

            welcomeName.textContent =
                data.name || "Customer";
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


            if (!token) {

                alert(
                    "Your session has expired. Please log in again."
                );


                window.location.href =
                    "login.html";


                return;
            }


            if (!selectedCustomerRating) {

                alert(
                    "Please select a rating."
                );

                return;
            }


            if (!review) {

                alert(
                    "Please enter a review."
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


                closeCustomerReviewModal();


                alert(
                    "Thank you for your review."
                );


                loadVerifiedVendors();


            } catch (error) {

                console.error(
                    "Review submission error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to submit your review."
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