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
        displayVendors(vendors);


        // Activate filters
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
// VENDOR FILTERS
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


    // Search vendor by name
    searchInput.addEventListener(
        "input",
        applyVendorFilters
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
                    (vendor.name || "")
                        .toLowerCase();


                const vendorCategory =
                    (vendor.category || "")
                        .toLowerCase();


                const vendorDistrict =
                    (vendor.district || "")
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


    displayVendors(filteredVendors);
}


// =====================================================
// DISPLAY VENDORS
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


    vendors.forEach(function(vendor) {

        const card =
            document.createElement("div");


        card.className =
            "vendor-card";


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

        `;


        vendorList.appendChild(card);

    });
}

// =====================================================
// CUSTOMER LOGOUT
// =====================================================

const customerLogout =
    document.getElementById("customerLogout");

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