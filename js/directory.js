// ===============================
// VENDOR DIRECTORY
// ===============================

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


// ===============================
// LOAD VERIFIED VENDORS
// ===============================

async function loadDirectory() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/vendors"
        );

        const vendors = await response.json();


        if (!response.ok) {

            throw new Error(
                "Failed to load vendors"
            );

        }


        // Only show verified vendors

        const verifiedVendors =
            vendors.filter(
                vendor =>
                    vendor.status === "Verified"
            );


        if (verifiedVendors.length === 0) {

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

// ===============================
// DISPLAY VENDORS
// ===============================

function displayVendors(vendors) {


    vendorDirectory.innerHTML = "";


    if (vendors.length === 0) {

        showNoVendors();

        return;

    }


    vendors.forEach(function(vendor) {


        const card =
            document.createElement("div");


        card.className =
            "vendor-card";


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
                ${vendor.description}
            </p>


        `;


        vendorDirectory.appendChild(card);

    });

}


// ===============================
// NO VENDORS
// ===============================

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

// ===============================
// FILTER
// ===============================

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

        // Get vendors from MongoDB through backend

        const response = await fetch(
            "http://localhost:5000/api/vendors"
        );


        const vendors =
            await response.json();


        if (!response.ok) {

            throw new Error(
                "Failed to load vendors"
            );

        }


        // Only verified vendors

        const verifiedVendors =
            vendors.filter(
                vendor =>
                    vendor.status === "Verified"
            );


        // Apply filters

        const filteredVendors =
            verifiedVendors.filter(
                vendor => {

                    const matchesSearch =

                        vendor.name
                            .toLowerCase()
                            .includes(search)

                        ||

                        vendor.businessName
                            .toLowerCase()
                            .includes(search);


                    const matchesCategory =

                        category === "" ||
                        vendor.category === category;


                    const matchesDistrict =

                        district === "" ||

                        vendor.district
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

// ===============================
// FILTER EVENTS
// ===============================

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


// ===============================
// LOAD DIRECTORY
// ===============================

if (vendorDirectory) {

    loadDirectory();

}