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
                document.getElementById(
                    "customerRegisterMessage"
                );

            if (password !== confirmPassword) {

                message.textContent =
                    "Passwords do not match.";

                message.style.color = "red";

                return;
            }

            try {

                const response =
                    await fetch(
                        "http://localhost:5000/api/customers",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
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

                    message.textContent =
                        "Registration successful! Customer ID: " +
                        data.customer.id;

                    message.style.color = "green";

                    customerRegisterForm.reset();

                    setTimeout(function () {

                        window.location.href =
                            "login.html";

                    }, 2000);

                } else {

                    message.textContent =
                        data.message ||
                        "Registration failed.";

                    message.style.color = "red";
                }

            } catch (error) {

                console.error(
                    "Customer registration error:",
                    error
                );

                message.textContent =
                    "Cannot connect to backend server.";

                message.style.color = "red";
            }
        }
    );
}



// =====================================================
// CUSTOMER LOGIN
// =====================================================

const customerLoginForm =
    document.getElementById("customerLoginForm");

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

                const response =
                    await fetch(
                        "http://localhost:5000/api/customers/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
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

                    // Remove old common authentication
                    localStorage.removeItem("token");
                    localStorage.removeItem("userRole");

                    // Save customer authentication
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

                    message.style.color =
                        "green";

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

                console.error(
                    "Customer login error:",
                    error
                );

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

    const token =
        localStorage.getItem(
            "customerToken"
        );

    const role =
        localStorage.getItem(
            "customerRole"
        );

    const customerId =
        localStorage.getItem(
            "customerId"
        );

    if (
        !token ||
        role !== "customer" ||
        !customerId
    ) {

        alert(
            "Please login as a customer first."
        );

        window.location.href =
            "login.html";

    } else {

        loadCustomerProfile(
            customerId,
            token
        );

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
                `http://localhost:5000/api/customers/${customerId}`,
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

            return;
        }

        const idElement =
            document.getElementById(
                "customerId"
            );

        if (idElement) {

            idElement.textContent =
                data.id || "-";
        }

        const profileName =
            document.getElementById(
                "profileName"
            );

        if (profileName) {

            profileName.textContent =
                data.name || "-";
        }

        const welcomeName =
            document.getElementById(
                "customerName"
            );

        if (welcomeName) {

            welcomeName.textContent =
                data.name || "Customer";
        }

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
                "http://localhost:5000/api/public/vendors"
            );

        const vendors =
            await response.json();

        if (!response.ok) {

            vendorList.innerHTML =
                "<p>Unable to load vendors.</p>";

            return;
        }

        allVerifiedVendors =
            vendors;

        populateDistrictFilter(
            vendors
        );

        await displayVendors(
            vendors
        );

        setupVendorFilters();

    } catch (error) {

        console.error(
            "Error loading vendors:",
            error
        );

        vendorList.innerHTML =
            "<p>Unable to load vendors.</p>";
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

    searchInput.addEventListener(
        "input",
        applyVendorFilters
    );

    categoryFilter.addEventListener(
        "change",
        applyVendorFilters
    );

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
                    (vendor.name || "")
                        .toLowerCase();

                const vendorBusiness =
                    (vendor.businessName || "")
                        .toLowerCase();

                const vendorCategory =
                    (vendor.category || "")
                        .toLowerCase();

                const vendorDistrict =
                    (vendor.district || "")
                        .toLowerCase();

                const matchesSearch =
                    vendorName.includes(searchText) ||
                    vendorBusiness.includes(searchText);

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
// DISPLAY VENDORS
// =====================================================

async function displayVendors(
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

    for (const vendor of vendors) {

        const card =
            document.createElement(
                "div"
            );

        card.className =
            "vendor-card";

        // Get rating information
        const rating =
            await getVendorRating(
                vendor.id
            );

        const averageRating =
            Number(
                rating.averageRating || 0
            ).toFixed(1);

        const reviewCount =
            rating.reviewCount || 0;

        card.innerHTML = `

            <span class="verified-badge">
                ✓ Verified Vendor
            </span>

            <h3>
                ${vendor.businessName || "Business"}
            </h3>

            <p>
                <strong>Owner:</strong>
                ${vendor.name || "N/A"}
            </p>

            <p>
                <strong>Category:</strong>
                ${vendor.category || "N/A"}
            </p>

            <p>
                <strong>Mobile:</strong>
                ${vendor.mobile || "N/A"}
            </p>

            <p>
                <strong>District:</strong>
                ${vendor.district || "N/A"}
            </p>

            <p>
                <strong>Address:</strong>
                ${vendor.address || "N/A"}
            </p>

            <!-- ==========================
                 RATING
            =========================== -->

            <div class="vendor-rating">

                <span class="rating-stars">
                    ⭐ ${averageRating}
                </span>

                <span class="review-count">
                    (${reviewCount} Reviews)
                </span>

            </div>

            <!-- ==========================
                 VIEW REVIEWS BUTTON
            =========================== -->

            <button
                class="view-reviews-btn"
                onclick="viewCustomerReviews('${vendor.id}')"
            >
                View Reviews
            </button>

            <!-- ==========================
                 RATE & REVIEW BUTTON
            =========================== -->

            <button
                class="rate-review-btn"
                onclick="openCustomerReviewModal(
                    '${vendor.id}',
                    '${vendor.businessName || "Vendor"}'
                )"
            >
                ⭐ Rate & Review
            </button>

        `;

        vendorList.appendChild(
            card
        );
    }
}



// =====================================================
// VIEW CUSTOMER REVIEWS
// =====================================================

async function viewCustomerReviews(
    vendorId
) {

    try {

        const response =
            await fetch(
                `http://localhost:5000/api/reviews/vendor/${vendorId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                "Unable to load reviews."
            );

            return;
        }

        let reviewText =
            "Average Rating: " +
            Number(
                data.averageRating || 0
            ).toFixed(1) +
            " ⭐\n\n";

        if (
            !data.reviews ||
            data.reviews.length === 0
        ) {

            reviewText +=
                "No reviews yet.";

        } else {

            data.reviews.forEach(
                function (review) {

                    reviewText +=
                        "⭐ " +
                        review.rating +
                        "/5 - " +
                        review.review +
                        "\n\n";

                }
            );
        }

        alert(
            reviewText
        );

    } catch (error) {

        console.error(
            "Error loading reviews:",
            error
        );

        alert(
            "Unable to load reviews."
        );
    }
}



// =====================================================
// OPEN CUSTOMER REVIEW MODAL
// =====================================================

function openCustomerReviewModal(
    vendorId,
    vendorName
) {

    const token =
        localStorage.getItem(
            "customerToken"
        );

    const role =
        localStorage.getItem(
            "customerRole"
        );

    if (
        !token ||
        role !== "customer"
    ) {

        alert(
            "Please login as a customer to submit a review."
        );

        window.location.href =
            "login.html";

        return;
    }

    const modal =
        document.getElementById(
            "customerReviewModal"
        );

    if (!modal) {

        alert(
            "Review modal not found."
        );

        return;
    }

    modal.style.display =
        "block";

    document.getElementById(
        "customerReviewVendorId"
    ).value =
        vendorId;

    document.getElementById(
        "customerReviewVendorName"
    ).textContent =
        "Vendor: " +
        vendorName;

    customerSelectedRating =
        0;

    document.getElementById(
        "customerSelectedRating"
    ).textContent =
        "Select your rating";

    document.getElementById(
        "customerReviewText"
    ).value =
        "";

    updateCustomerStars();
}



// =====================================================
// CLOSE CUSTOMER REVIEW MODAL
// =====================================================

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



// =====================================================
// CUSTOMER STAR RATING
// =====================================================

let customerSelectedRating = 0;


function selectCustomerRating(
    rating
) {

    customerSelectedRating =
        rating;

    document.getElementById(
        "customerSelectedRating"
    ).textContent =
        "You selected " +
        rating +
        " out of 5";

    updateCustomerStars();
}



// =====================================================
// UPDATE CUSTOMER STARS
// =====================================================

function updateCustomerStars() {

    const stars =
        document.querySelectorAll(
            "#customerStarRating span"
        );

    stars.forEach(
        function (star, index) {

            if (
                index <
                customerSelectedRating
            ) {

                star.classList.add(
                    "selected"
                );

            } else {

                star.classList.remove(
                    "selected"
                );
            }
        }
    );
}



// =====================================================
// SUBMIT CUSTOMER REVIEW
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

            if (
                customerSelectedRating === 0
            ) {

                alert(
                    "Please select a rating."
                );

                return;
            }

            const vendorId =
                document.getElementById(
                    "customerReviewVendorId"
                ).value;

            const review =
                document.getElementById(
                    "customerReviewText"
                ).value.trim();

            if (!review) {

                alert(
                    "Please write a review."
                );

                return;
            }

            const token =
                localStorage.getItem(
                    "customerToken"
                );

            const role =
                localStorage.getItem(
                    "customerRole"
                );

            if (
                !token ||
                role !== "customer"
            ) {

                alert(
                    "Please login as a customer first."
                );

                window.location.href =
                    "login.html";

                return;
            }

            try {

                const response =
                    await fetch(
                        "http://localhost:5000/api/reviews",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " +
                                    token
                            },

                            body:
                                JSON.stringify({
                                    vendorId:
                                        vendorId,

                                    rating:
                                        customerSelectedRating,

                                    review:
                                        review
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.message ||
                        "Failed to submit review."
                    );

                    return;
                }

                alert(
                    "Rating and review submitted successfully!"
                );

                closeCustomerReviewModal();

                await loadVerifiedVendors();

            } catch (error) {

                console.error(
                    "Customer review submission error:",
                    error
                );

                alert(
                    "Unable to submit review."
                );
            }
        }
    );
}



// =====================================================
// CUSTOMER LOGOUT
// =====================================================

const customerLogout =
    document.getElementById(
        "customerLogout"
    );

if (customerLogout) {

    customerLogout.addEventListener(
        "click",
        function () {

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