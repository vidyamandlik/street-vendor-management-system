// =====================================================
// VENDOR DIRECTORY
// =====================================================

const vendorDirectory =
    document.getElementById(
        "vendorDirectory"
    );


const searchInput =
    document.getElementById(
        "searchVendor"
    );


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


const districtFilter =
    document.getElementById(
        "districtFilter"
    );

let allVerifiedVendors = [];
let directoryRenderVersion = 0;

function debounce(func, delay = 250) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}



// =====================================================
// LOAD VERIFIED VENDORS
// =====================================================

async function loadDirectory() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/vendors"
            );


        const vendors =
            await response.json();


        if (!response.ok) {

            throw new Error(
                "Failed to load vendors"
            );

        }


        const verifiedVendors = vendors.filter(function (vendor) {
            return String(vendor.status || "").toLowerCase() === "verified";
        });

        allVerifiedVendors = verifiedVendors;


        if (
            verifiedVendors.length === 0
        ) {

            showNoVendors();

            return;

        }


        filterVendors();

    } catch (error) {

        console.error(
            "Error loading directory:",
            error
        );

        showNoVendors();

    }
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
                `http://localhost:5000/api/reviews/vendor/${encodeURIComponent(vendorId)}`
            );


        if (!response.ok) {

            return {
                averageRating: 0,
                reviewCount: 0
            };

        }


        const data =
            await response.json();


        return data;

    } catch (error) {

        console.error(
            "Error loading rating:",
            error
        );

        return {
            averageRating: 0,
            reviewCount: 0
        };

    }
}



// =====================================================
// DISPLAY VENDORS
// =====================================================

async function displayVendors(
    vendors
) {

    if (!vendorDirectory) {
        return;
    }

    const renderVersion = ++directoryRenderVersion;

    vendorDirectory.innerHTML =
        "";


    if (
        vendors.length === 0
    ) {

        showNoVendors();

        return;

    }


    const ratings = await Promise.all(
        vendors.map(function (vendor) {
            return vendor.id ? getVendorRating(vendor.id) : Promise.resolve({ averageRating: 0, reviewCount: 0 });
        })
    );

    // Ignore an older asynchronous render if a newer filter was applied.
    if (renderVersion !== directoryRenderVersion) {
        return;
    }

    const fragment = document.createDocumentFragment();

    vendors.forEach(function (vendor, index) {
        const card = document.createElement("div");
        const header = document.createElement("div");
        const heading = document.createElement("h2");
        const badge = document.createElement("span");
        const ratingContainer = document.createElement("div");
        const ratingStars = document.createElement("span");
        const reviewCount = document.createElement("span");
        const viewButton = document.createElement("button");
        const rateButton = document.createElement("button");
        const rating = ratings[index];
        const averageRating = Number(rating.averageRating || 0).toFixed(1);

        card.className = "vendor-card";
        header.className = "vendor-card-header";
        heading.textContent = vendor.businessName || "Business";
        badge.className = "verified-badge";
        badge.textContent = "✓ Verified";
        header.append(heading, badge);

        addVendorDetail(card, "Owner", vendor.name);
        addVendorDetail(card, "Category", vendor.category);
        addVendorDetail(card, "District", vendor.district);
        addVendorDetail(card, "Business Experience", `${vendor.years || 0} years`);

        if (vendor.description) {
            const description = document.createElement("p");
            description.textContent = vendor.description;
            card.appendChild(description);
        }

        ratingContainer.className = "vendor-rating";
        ratingStars.className = "rating-stars";
        ratingStars.textContent = `⭐ ${averageRating}`;
        reviewCount.className = "review-count";
        reviewCount.textContent = `(${rating.reviewCount || 0} Reviews)`;
        ratingContainer.append(ratingStars, reviewCount);

        viewButton.type = "button";
        viewButton.className = "view-reviews-btn";
        viewButton.textContent = "View Reviews";
        viewButton.addEventListener("click", function () {
            viewReviews(vendor.id);
        });

        rateButton.type = "button";
        rateButton.className = "rate-review-btn";
        rateButton.textContent = "⭐ Rate & Review";
        rateButton.addEventListener("click", function () {
            openReviewModal(vendor.id, vendor.businessName || "Business");
        });

        if (!vendor.id) {
            viewButton.disabled = true;
            rateButton.disabled = true;
        }

        card.prepend(header);
        card.append(ratingContainer, viewButton, rateButton);
        fragment.appendChild(card);
    });

    vendorDirectory.appendChild(fragment);
}

function addVendorDetail(card, label, value) {
    const detail = document.createElement("p");
    const labelElement = document.createElement("strong");

    labelElement.textContent = `${label}: `;
    detail.append(labelElement, document.createTextNode(value || "N/A"));
    card.appendChild(detail);
}



// =====================================================
// VIEW REVIEWS
// =====================================================

async function viewReviews(
    vendorId
) {

    try {

        const response =
            await fetch(
                `http://localhost:5000/api/reviews/vendor/${encodeURIComponent(vendorId)}`
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
            `Average Rating: ${
                Number(
                    data.averageRating || 0
                ).toFixed(1)
            } ⭐\n\n`;


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
                        `⭐ ${review.rating}/5 - ${review.review}\n\n`;

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
// NO VENDORS
// =====================================================

function showNoVendors() {

    vendorDirectory.innerHTML = `

        <div class="no-vendors">

            <h2>
                No verified vendors found.
            </h2>

            <p>
                Verified vendors will appear here
                after admin approval.
            </p>

        </div>

    `;
}



// =====================================================
// FILTER VENDORS
// =====================================================

function filterVendors() {

    if (!searchInput || !categoryFilter || !districtFilter) {
        return;
    }

    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    const category =
        categoryFilter.value;


    const district =
        districtFilter.value
            .toLowerCase()
            .trim();


        const filteredVendors =
            allVerifiedVendors.filter(
                function (vendor) {

                    const matchesSearch =

                        String(vendor.name || "")
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(vendor.businessName || "")
                            .toLowerCase()
                            .includes(search);


                    const matchesCategory =

                        category === "" ||

                        vendor.category ===
                        category;


                    const matchesDistrict =

                        district === "" ||

                        String(vendor.district || "")
                            .toLowerCase()
                            .includes(district);


                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesDistrict
                    );

                }
            );


        displayVendors(filteredVendors);
}



// =====================================================
// FILTER EVENTS
// =====================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        debounce(filterVendors, 200)
    );

}


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        filterVendors
    );

}


if (districtFilter) {

    districtFilter.addEventListener(
        "change",
        filterVendors
    );

}



// =====================================================
// RATING & REVIEW
// =====================================================

let selectedRating = 0;



// =====================================================
// OPEN REVIEW MODAL
// =====================================================

function openReviewModal(
    vendorId,
    vendorName
) {

    // IMPORTANT:
    // Customer login stores token as customerToken

    const token =
        localStorage.getItem(
            "customerToken"
        );


    const role =
        localStorage.getItem(
            "customerRole"
        );


    // Check customer login

    if (
        !token ||
        role !== "customer"
    ) {

        alert(
            "Please login as a customer to submit a review."
        );


        window.location.href =
            "../customer/login.html";


        return;

    }


    document.getElementById(
        "reviewModal"
    ).style.display =
        "block";


    document.getElementById(
        "reviewVendorId"
    ).value =
        vendorId;


    document.getElementById(
        "reviewVendorName"
    ).textContent =
        "Vendor: " +
        vendorName;


    selectedRating = 0;


    document.getElementById(
        "selectedRating"
    ).textContent =
        "Select your rating";


    document.getElementById(
        "reviewText"
    ).value =
        "";


    updateStars();

}



// =====================================================
// CLOSE REVIEW MODAL
// =====================================================

function closeReviewModal() {

    document.getElementById(
        "reviewModal"
    ).style.display =
        "none";

}



// =====================================================
// SELECT RATING
// =====================================================

function selectRating(
    rating
) {

    selectedRating =
        rating;


    document.getElementById(
        "selectedRating"
    ).textContent =
        "You selected " +
        rating +
        " out of 5";


    updateStars();

}



// =====================================================
// UPDATE STARS
// =====================================================

function updateStars() {

    const stars =
        document.querySelectorAll(
            ".star-rating span"
        );


    stars.forEach(
        function (
            star,
            index
        ) {

            if (
                index <
                selectedRating
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
// SUBMIT REVIEW
// =====================================================

const reviewForm =
    document.getElementById(
        "reviewForm"
    );


if (reviewForm) {

    reviewForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // Check rating

            if (
                selectedRating === 0
            ) {

                alert(
                    "Please select a rating."
                );

                return;

            }


            const vendorId =
                document.getElementById(
                    "reviewVendorId"
                ).value;


            const review =
                document.getElementById(
                    "reviewText"
                ).value
                    .trim();


            // Check review text

            if (!review) {

                alert(
                    "Please write a review."
                );

                return;

            }


            // =========================================
            // GET CUSTOMER TOKEN
            // =========================================

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
                    "../customer/login.html";

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
                                        selectedRating,

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


                closeReviewModal();


                // Reload ratings

                loadDirectory();

            } catch (error) {

                console.error(
                    "Review submission error:",
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
// LOAD DIRECTORY
// =====================================================

if (vendorDirectory) {

    loadDirectory();

}
