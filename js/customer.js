// =====================================================
// STREET VENDOR MANAGEMENT SYSTEM - CUSTOMER MODULE
// =====================================================

const API_BASE_URL = "http://localhost:5000/api";

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

// Utility: Debounce for performance optimization on search input
function debounce(func, delay = 250) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
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

const customerRegisterForm = document.getElementById("customerRegisterForm");

if (customerRegisterForm) {
    customerRegisterForm.addEventListener("submit", async function (event) {
        event.preventDefault();

            const name =
                document.getElementById("customerName").value.trim();

            const mobile =
                document.getElementById("customerMobile").value.trim();

            const email =
                document.getElementById("customerEmail").value.trim();

            const password =
                document.getElementById("customerPassword").value;

            const confirmPassword =
                document.getElementById("confirmPassword").value;

            const message =
                document.getElementById("customerRegisterMessage");


            // Check password

            if (password !== confirmPassword) {

                message.textContent =
                    "Passwords do not match.";

                message.style.color = "red";

                return;
            }


            try {

                const response = await fetch(
                    "http://localhost:5000/api/customers",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            name: name,
                            mobile: mobile,
                            email: email,
                            password: password
                        })
                    }
                );


                const data = await response.json();


                if (response.ok) {

                    message.textContent =
                        "Registration successful! Customer ID: "
                        + data.customer.id;

                    message.style.color = "green";

                    customerRegisterForm.reset();

                    setTimeout(function () {

                        window.location.href = "login.html";

                    }, 2000);

                } else {

                    message.textContent =
                        data.message ||
                        "Registration failed.";

                    message.style.color = "red";

                }

            } catch (error) {

                console.error(error);

            if (message) {
                if (!navigator.onLine) {
                    message.textContent = "You appear to be offline. Please check your internet connection.";
                } else {
                    message.textContent = "Cannot connect to backend server. Please verify the server is running.";
                }
                message.style.color = "red";
            }

        }
    });
}


// =====================================================
// CUSTOMER LOGIN
// =====================================================

const customerLoginForm = document.getElementById("customerLoginForm");

if (customerLoginForm) {

    customerLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const loginId =
                document
                    .getElementById("customerLoginId")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("customerLoginPassword")
                    .value;


            const message =
                document.getElementById(
                    "customerLoginMessage"
                );


            try {

                const response = await fetch(
                    "http://localhost:5000/api/customers/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            loginId: loginId,
                            password: password
                        })
                    }
                );


                const data = await response.json();


                console.log(
                    "Customer login response:",
                    data
                );


                if (response.ok) {

                    // Save customer information

                    localStorage.setItem(
                        "customerToken",
                        data.token
                    );

                    localStorage.setItem(
                        "customerRole",
                        "customer"
                    );

                    localStorage.setItem(
                        "customerId",
                        data.customer.id
                    );

                    localStorage.setItem(
                        "customerName",
                        data.customer.name
                    );


                    message.textContent =
                        "Login successful!";

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

                    message.style.color = "red";

                }

            } catch (error) {

                console.error(error);

                message.textContent =
                    "Cannot connect to backend server.";

                message.style.color = "red";

            }

        }
    );
}




// =====================================================
// CUSTOMER DASHBOARD
// =====================================================

const customerDashboard =
    document.querySelector(".customer-dashboard");

if (customerDashboard) {

    const token =
        localStorage.getItem("customerToken");

    const role =
        localStorage.getItem("customerRole");

    const customerId =
        localStorage.getItem("customerId");


    // Check customer login
    if (!token || role !== "customer" || !customerId) {

        alert("Please login as a customer first.");

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

async function loadCustomerProfile(customerId, token) {

    try {

        const response = await fetch(
            `http://localhost:5000/api/customers/${customerId}`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            console.error(
                "Customer profile error:",
                data
            );

            return;
        }


        // Customer ID
        const idElement =
            document.getElementById("customerId");

        if (idElement) {
            idElement.textContent =
                data.id || "-";
        }


        // Profile name
        const profileName =
            document.getElementById("profileName");

        if (profileName) {
            profileName.textContent =
                data.name || "-";
        }


        // Welcome name
        const welcomeName =
            document.getElementById("customerName");

        if (welcomeName) {
            welcomeName.textContent =
                data.name || "Customer";
        }


        // Email
        const profileEmail =
            document.getElementById("profileEmail");

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
        document.getElementById("vendorList");


    if (!vendorList) {
        return;
    }


    try {

        const response = await fetch(
            "http://localhost:5000/api/public/vendors"
        );


        const vendors =
            await response.json();


        if (!response.ok) {

            vendorList.innerHTML =
                "<p>Unable to load vendors.</p>";

            return;
        }


        // Store vendors for filtering
        allVerifiedVendors = vendors;


        // Populate district filter
        populateDistrictFilter(vendors);


        // Display all vendors
        setupVendorFilters();
        applyVendorFilters();

    } catch (error) {
        console.error("Error loading vendors:", error);
        if (vendorList) {
            vendorList.innerHTML = "<p>Unable to connect to backend server. Please verify the server is running.</p>";
        }
    }
}



// =====================================================
// POPULATE DISTRICT FILTER (Optimized with DocumentFragment)
// =====================================================

function populateDistrictFilter(vendors) {

    const districtFilter =
        document.getElementById("districtFilter");


    if (!districtFilter) {
        return;
    }


    // Remove old district options
    districtFilter.innerHTML =
        '<option value="">All Districts</option>';


    const districts =
        [...new Set(
            vendors
                .map(function(vendor) {
                    return vendor.district;
                })
                .filter(function(district) {
                    return district;
                })
        )];


    districts.sort();


    districts.forEach(function(district) {

        const option =
            document.createElement("option");

        option.value = district;

        option.textContent = district;

        districtFilter.appendChild(option);

    });
}



// =====================================================
// VENDOR FILTERS (Debounced & Cached Elements)
// =====================================================

function setupVendorFilters() {

    const searchInput =
        document.getElementById("vendorSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const districtFilter =
        document.getElementById("districtFilter");


    if (
        !searchInput ||
        !categoryFilter ||
        !districtFilter
    ) {
        return;
    }

    if (searchInput.dataset.filtersInitialized === "true") {
        return;
    }

    searchInput.dataset.filtersInitialized = "true";


    // Search vendor by name
    searchInput.addEventListener(
        "input",
        debounce(applyVendorFilters, 200)
    );


    // Filter by category
    categoryFilter.addEventListener(
        "change",
        applyVendorFilters
    );


    // Filter by district
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
        document.getElementById("vendorSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const districtFilter =
        document.getElementById("districtFilter");

    if (!searchInput || !categoryFilter || !districtFilter) {
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
            function(vendor) {

                const vendorName =
                    String(vendor.name || "")
                        .toLowerCase();


                const vendorCategory =
                    String(vendor.category || "")
                        .toLowerCase();


                const vendorDistrict =
                    String(vendor.district || "")
                        .toLowerCase();


                const matchesSearch =
                    vendorName.includes(
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
                `http://localhost:5000/api/reviews/vendor/${vendorId}`
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
// DISPLAY VENDORS (Optimized with DocumentFragment & XSS Protection)
// =====================================================

function displayVendors(vendors) {

    const vendorList =
        document.getElementById("vendorList");


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


    const fragment = document.createDocumentFragment();

    vendors.forEach(function(vendor) {
        const card = document.createElement("div");
        const badge = document.createElement("span");
        const heading = document.createElement("h3");
        const rating = document.createElement("p");
        const reviewButton = document.createElement("button");

        card.className = "vendor-card";
        badge.className = "verified-badge";
        badge.textContent = "✓ Verified Vendor";
        heading.textContent = vendor.businessName || "Business";
        rating.textContent = "Loading rating...";
        rating.className = "vendor-rating";

        addVendorDetail(card, "Owner", vendor.name);
        addVendorDetail(card, "Category", vendor.category);
        addVendorDetail(card, "Mobile", vendor.mobile);
        addVendorDetail(card, "District", vendor.district);
        addVendorDetail(card, "Address", vendor.address);

        reviewButton.type = "button";
        reviewButton.className = "submit-review-btn";
        reviewButton.textContent = "Rate & Review";
        reviewButton.addEventListener("click", function () {
            openCustomerReviewModal(vendor.id, vendor.businessName || vendor.name || "Vendor");
        });

        card.prepend(badge, heading);
        card.append(rating, reviewButton);
        fragment.appendChild(card);

        if (vendor.id) {
            getVendorRating(vendor.id).then(function (ratingData) {
                rating.textContent = ratingData.reviewCount > 0
                    ? `Rating: ${ratingData.averageRating}/5 (${ratingData.reviewCount} review${ratingData.reviewCount === 1 ? "" : "s"})`
                    : "No ratings yet";
            });
        } else {
            rating.textContent = "No ratings yet";
            reviewButton.disabled = true;
        }
    });

    vendorList.appendChild(fragment);
}

function addVendorDetail(card, label, value) {
    const detail = document.createElement("p");
    const labelElement = document.createElement("strong");

    labelElement.textContent = `${label}: `;
    detail.append(labelElement, document.createTextNode(value || "N/A"));
    card.appendChild(detail);
}

// =====================================================
// CUSTOMER REVIEW MODAL
// =====================================================

let selectedCustomerRating = 0;

function openCustomerReviewModal(vendorId, vendorName) {
    const modal = document.getElementById("customerReviewModal");
    const vendorIdInput = document.getElementById("customerReviewVendorId");
    const vendorNameElement = document.getElementById("customerReviewVendorName");
    const reviewText = document.getElementById("customerReviewText");

    if (!modal || !vendorIdInput || !vendorNameElement || !reviewText || !vendorId) {
        return;
    }

    vendorIdInput.value = vendorId;
    vendorNameElement.textContent = `Rate ${vendorName}`;
    reviewText.value = "";
    selectCustomerRating(0);
    modal.style.display = "block";
}

function closeCustomerReviewModal() {
    const modal = document.getElementById("customerReviewModal");
    if (modal) {
        modal.style.display = "none";
    }
}

function selectCustomerRating(rating) {
    selectedCustomerRating = rating;
    const stars = document.querySelectorAll("#customerStarRating button");
    const selectedRatingText = document.getElementById("customerSelectedRating");

    stars.forEach(function (star, index) {
        star.classList.toggle("selected", index < rating);
    });

    if (selectedRatingText) {
        selectedRatingText.textContent = rating
            ? `Selected rating: ${rating} of 5`
            : "Select your rating";
    }
}

window.openCustomerReviewModal = openCustomerReviewModal;
window.closeCustomerReviewModal = closeCustomerReviewModal;
window.selectCustomerRating = selectCustomerRating;

const customerReviewForm = document.getElementById("customerReviewForm");

if (customerReviewForm) {
    customerReviewForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const token = localStorage.getItem("customerToken");
        const vendorId = document.getElementById("customerReviewVendorId").value;
        const review = document.getElementById("customerReviewText").value.trim();
        const submitButton = customerReviewForm.querySelector("button[type='submit']");

        if (!token) {
            alert("Your session has expired. Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!selectedCustomerRating) {
            alert("Please select a rating.");
            return;
        }

        if (!review) {
            alert("Please enter a review.");
            return;
        }

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ vendorId, rating: selectedCustomerRating, review })
            });
            const result = await parseJsonResponse(response);

            if (!response.ok) {
                throw new Error((result && result.message) || "Unable to submit your review.");
            }

            closeCustomerReviewModal();
            alert("Thank you for your review.");
            loadVerifiedVendors();
        } catch (error) {
            console.error("Review submission error:", error);
            alert(error.message || "Unable to submit your review.");
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// =====================================================
// CUSTOMER LOGOUT & SESSION MANAGEMENT
// =====================================================

const customerLogout =
    document.getElementById("customerLogout");

if (customerLogout) {

    customerLogout.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            localStorage.removeItem(
                "customerToken"
            );

            localStorage.removeItem(
                "customerRole"
            );

            localStorage.removeItem(
                "customerId"
            );

            localStorage.removeItem(
                "customerName"
            );


            window.location.href =
                "../index.html";

        }
    );

}
