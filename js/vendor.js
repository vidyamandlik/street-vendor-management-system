// =====================================================
// STREET VENDOR MANAGEMENT SYSTEM - VENDOR MODULE
// =====================================================

const API_BASE_URL = "http://localhost:5000/api";

// =====================================================
// LOCAL STORAGE KEYS
// =====================================================

const VENDOR_TOKEN_KEY = "vendorToken";
const VENDOR_ROLE_KEY = "vendorRole";
const VENDOR_ID_KEY = "loggedInVendorId";


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

    if (
        !data.name ||
        !data.mobile ||
        !data.email ||
        !data.password ||
        !data.businessName ||
        !data.category ||
        !data.district ||
        !data.address ||
        data.years === ""
    ) {
        alert("Please fill all required fields.");
        return;
    }

    try {
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

        alert(
            error.message ||
            "Vendor registration failed."
        );
    }
}


// =====================================================
// VENDOR LOGIN
// =====================================================

async function handleVendorLogin(event) {
    event.preventDefault();

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

        console.log("Vendor login response:", result);

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

        // Save vendor login information
        localStorage.setItem(
            VENDOR_TOKEN_KEY,
            result.token
        );

        localStorage.setItem(
            VENDOR_ROLE_KEY,
            result.role || "vendor"
        );

        localStorage.setItem(
            VENDOR_ID_KEY,
            result.vendor?.id ||
            result.id ||
            vendorId
        );

        console.log("Vendor login saved successfully.");

        // Redirect to vendor dashboard
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Vendor login error:", error);

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
    localStorage.removeItem(VENDOR_TOKEN_KEY);
    localStorage.removeItem(VENDOR_ROLE_KEY);
    localStorage.removeItem(VENDOR_ID_KEY);

    window.location.href = "login.html";
}


// =====================================================
// LOAD LOGGED-IN VENDOR PROFILE
// =====================================================

async function loadVendorProfile() {
    const token =
        localStorage.getItem(VENDOR_TOKEN_KEY);

    const vendorId =
        localStorage.getItem(VENDOR_ID_KEY);

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
    const token =
        localStorage.getItem("customerToken");

    const role =
        localStorage.getItem("customerRole");

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

                        <h4>
                            ${escapeHtml(product)}
                        </h4>

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

            return `
                <div class="profile-product-item">

                    <h4>
                        ${escapeHtml(productName)}
                    </h4>

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

async function loadVendorDirectory() {
    const mainContent =
        document.getElementById("mainContent");

    if (!mainContent) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/public/vendors`
        );

        const vendors =
            await getResponseData(response);

        if (!response.ok) {
            throw new Error(
                vendors.message ||
                "Unable to load vendors."
            );
        }

        renderVendorDirectory(vendors);

    } catch (error) {
        console.error(
            "Vendor directory error:",
            error
        );

        mainContent.innerHTML = `
            <section class="directory-page">

                <div class="directory-header">

                    <h1>
                        Vendor Directory
                    </h1>

                    <p>
                        Unable to load vendors.
                    </p>

                    <p>
                        ${escapeHtml(error.message)}
                    </p>

                </div>

            </section>
        `;
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
    const mainContent =
        document.getElementById("mainContent");

    if (!mainContent) {
        return;
    }

    if (
        !Array.isArray(vendors) ||
        vendors.length === 0
    ) {
        mainContent.innerHTML = `
            <section class="directory-page">

                <div class="directory-header">

                    <h1>
                        Vendor Directory
                    </h1>

                    <p>
                        No verified vendors available.
                    </p>

                </div>

            </section>
        `;

        return;
    }


    // Load ratings
    const vendorsWithRatings =
        await Promise.all(
            vendors.map(async vendor => {
                const rating =
                    await getVendorRating(
                        vendor.id
                    );

                return {
                    ...vendor,
                    rating
                };
            })
        );


    mainContent.innerHTML = `
        <section class="directory-page">

            <div class="directory-header">

                <h1>
                    Vendor Directory
                </h1>

                <p>
                    Explore verified street vendors.
                </p>

            </div>


            <div class="vendor-grid">

                ${vendorsWithRatings.map(vendor => {

                    const rating =
                        vendor.rating || {};

                    const averageRating =
                        Number(
                            rating.averageRating || 0
                        ).toFixed(1);

                    const reviewCount =
                        Number(
                            rating.reviewCount || 0
                        );

                    return `
                        <div class="vendor-card">

                            <h2>
                                ${escapeHtml(
                                    vendor.businessName
                                )}
                            </h2>


                            <p>
                                <strong>
                                    Owner:
                                </strong>

                                ${escapeHtml(
                                    vendor.name
                                )}
                            </p>


                            <p>
                                <strong>
                                    Category:
                                </strong>

                                ${escapeHtml(
                                    vendor.category
                                )}
                            </p>


                            <p>
                                <strong>
                                    District:
                                </strong>

                                ${escapeHtml(
                                    vendor.district
                                )}
                            </p>


                            <p class="vendor-card-rating">

                                ★ ${averageRating}

                                <span>
                                    (${reviewCount} reviews)
                                </span>

                            </p>


                            <a
                                class="view-profile-btn"
                                href="vendors.html?id=${encodeURIComponent(
                                    vendor.id
                                )}"
                            >
                                View Profile
                            </a>

                        </div>
                    `;

                }).join("")}

            </div>

        </section>
    `;
}


// =====================================================
// REVIEWS
// =====================================================

let selectedRating = 0;


// =====================================================
// OPEN REVIEW MODAL
// =====================================================

function openReviewModal(vendorId, vendorName) {
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

    const token =
        localStorage.getItem("customerToken");

    const customerRole =
        localStorage.getItem("customerRole");

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

        messageElement.textContent =
            "Please login as a customer first.";

        return;
    }


    if (customerRole !== "customer") {

        messageElement.textContent =
            "Please login using a customer account.";

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
        // CLOSE MODAL OUTSIDE CLICK
        // =================================================

        const reviewModal =
            document.getElementById(
                "reviewModal"
            );

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

        const customerToken =
            localStorage.getItem(
                "customerToken"
            );

        const customerRole =
            localStorage.getItem(
                "customerRole"
            );

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