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

function loadDirectory() {

    const vendorData =
        localStorage.getItem("vendors");


    if (!vendorData) {

        showNoVendors();

        return;

    }


    const vendors =
        JSON.parse(vendorData);


    const verifiedVendors =
        vendors.filter(
            vendor =>
                vendor.status === "Verified"
        );


    displayVendors(
        verifiedVendors
    );

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

function filterVendors() {


    const vendorData =
        localStorage.getItem(
            "vendorData"
        );


    if (!vendorData) {

        showNoVendors();

        return;

    }

    const vendors =
    JSON.parse(vendorData);


const verifiedVendors =
    vendors.filter(
        vendor =>
            vendor.status === "Verified"
    );


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

    
}


// ===============================
// FILTER EVENTS
// ===============================

searchInput.addEventListener(
    "input",
    filterVendors
);


categoryFilter.addEventListener(
    "change",
    filterVendors
);


districtFilter.addEventListener(
    "input",
    filterVendors
);


// Load directory

loadDirectory();