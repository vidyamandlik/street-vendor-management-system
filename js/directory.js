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


        const verifiedVendors =
            vendors.filter(
                function (vendor) {

                    return (
                        vendor.status ===
                        "Verified"
                    );

                }
            );


        if (
            verifiedVendors.length === 0
        ) {

            showNoVendors();

            return;

        }


        displayVendors(
            verifiedVendors
        );

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
                `http://localhost:5000/api/reviews/vendor/${vendorId}`
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

    vendorDirectory.innerHTML =
        "";


    if (
        vendors.length === 0
    ) {

        showNoVendors();

        return;

    }


    for (
        const vendor of vendors
    ) {

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "vendor-card";


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

            <div class="vendor-card-header">

                <h2>
                    ${vendor.businessName}
                </h2>

                <span class="verified-badge">
                    ✓ Verified
                </span>

            </div>


            <p>
                <strong>Owner:</strong>
                ${vendor.name}
            </p>


            <p>
                <strong>Category:</strong>
                ${vendor.category}
            </p>


            <p>
                <strong>District:</strong>
                ${vendor.district}
            </p>


            <p>
                <strong>Business Experience:</strong>
                ${vendor.years} years
            </p>


            <p>
                ${vendor.description || ""}
            </p>


            <!-- RATING -->

            <div class="vendor-rating">

                <span class="rating-stars">
                    ⭐ ${averageRating}
                </span>

                <span class="review-count">
                    (${reviewCount} Reviews)
                </span>

            </div>


            <!-- VIEW REVIEWS -->

            <button
                class="view-reviews-btn"
                onclick="viewReviews(
                    '${vendor.id}'
                )"
            >
                View Reviews
            </button>


            <!-- RATE & REVIEW -->

            <button
                class="rate-review-btn"
                onclick="openReviewModal(
                    '${vendor.id}',
                    '${vendor.businessName}'
                )"
            >
                ⭐ Rate & Review
            </button>

        `;


        vendorDirectory.appendChild(
            card
        );
    }
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

async function filterVendors() {

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


        const verifiedVendors =
            vendors.filter(
                function (vendor) {

                    return (
                        vendor.status ===
                        "Verified"
                    );

                }
            );


        const filteredVendors =
            verifiedVendors.filter(
                function (vendor) {

                    const matchesSearch =

                        (vendor.name || "")
                            .toLowerCase()
                            .includes(search)

                        ||

                        (vendor.businessName || "")
                            .toLowerCase()
                            .includes(search);


                    const matchesCategory =

                        category === "" ||

                        vendor.category ===
                        category;


                    const matchesDistrict =

                        district === "" ||

                        (vendor.district || "")
                            .toLowerCase()
                            .includes(district);


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

    } catch (error) {

        console.error(
            "Error filtering vendors:",
            error
        );

        showNoVendors();

    }
}



// =====================================================
// FILTER EVENTS
// =====================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterVendors
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
        "input",
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