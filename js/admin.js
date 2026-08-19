const adminLoginForm =
    document.getElementById("adminLoginForm");


if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const username =
                document.getElementById(
                    "adminUsername"
                ).value;

            const password =
                document.getElementById(
                    "adminPassword"
                ).value;


            // Prototype credentials

            if (
                username === "admin" &&
                password === "admin123"
            ) {

                localStorage.setItem(
                    "adminLoggedIn",
                    "true"
                );


                window.location.href =
                    "dashboard.html";

            }

            else {

                document.getElementById(
                    "loginError"
                ).textContent =
                    "Invalid username or password.";

            }

        }
    );

}

// ===============================
// ADMIN DASHBOARD
// ===============================


const vendorTableBody =
    document.getElementById(
        "vendorTableBody"
    );


if (vendorTableBody) {


    // Check admin login

    const loggedIn =
        localStorage.getItem(
            "adminLoggedIn"
        );


    if (loggedIn !== "true") {

        window.location.href =
            "login.html";

    }


    loadVendorData();

}


// ===============================
// LOAD VENDOR DATA
// ===============================

function loadVendorData() {



    const vendorData =
        localStorage.getItem("vendors");


    if (!vendorData) {

        updateStatistics([]);

        return;

    }


    const vendors =
        JSON.parse(vendorData);


    updateStatistics(vendors);


    displayVendors(vendors);

}


// ===============================
// DISPLAY VENDORS
// ===============================

function displayVendors(vendors) {


    vendorTableBody.innerHTML = "";


    vendors.forEach(function(vendor) {


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${vendor.id}</td>

            <td>${vendor.name}</td>

            <td>${vendor.businessName}</td>

            <td>${vendor.category}</td>

            <td>${vendor.district}</td>

            <td>
                <span class="status">
                    ${vendor.status}
                </span>
            </td>

            <td>

                <button
                    class="approve-btn"
                    onclick="approveVendor('${vendor.id}')"
                >
                    Approve
                </button>

                <button
                    class="reject-btn"
                    onclick="rejectVendor('${vendor.id}')"
                >
                    Reject
                </button>

            </td>

        `;


        vendorTableBody.appendChild(row);

    });

}


// ===============================
// STATISTICS
// ===============================

function updateStatistics(vendors) {


    document.getElementById(
        "totalVendors"
    ).textContent =
        vendors.length;


    document.getElementById(
        "pendingVendors"
    ).textContent =
        vendors.filter(
            v => v.status === "Pending"
        ).length;


    document.getElementById(
        "verifiedVendors"
    ).textContent =
        vendors.filter(
            v => v.status === "Verified"
        ).length;


    document.getElementById(
        "rejectedVendors"
    ).textContent =
        vendors.filter(
            v => v.status === "Rejected"
        ).length;

}


// ===============================
// APPROVE VENDOR
// ===============================



    function approveVendor(vendorId) {

    const vendorData =
        localStorage.getItem("vendors");


    if (!vendorData) {
        return;
    }


    const vendors =
        JSON.parse(vendorData);


    const vendor =
        vendors.find(
            v => v.id === vendorId
        );


    if (vendor) {

        vendor.status = "Verified";


        localStorage.setItem(
            "vendors",
            JSON.stringify(vendors)
        );


        alert(
            "Vendor approved successfully!"
        );


        location.reload();

    }

}


// ===============================
// REJECT VENDOR
// ===============================

function rejectVendor(vendorId) {

    const vendorData =
        localStorage.getItem("vendors");


    if (!vendorData) {
        return;
    }


    const vendors =
        JSON.parse(vendorData);


    const vendor =
        vendors.find(
            v => v.id === vendorId
        );


    if (vendor) {

        vendor.status = "Rejected";


        localStorage.setItem(
            "vendors",
            JSON.stringify(vendors)
        );


        alert(
            "Vendor rejected."
        );


        location.reload();

    }

}


// ===============================
// LOGOUT
// ===============================

function logout() {

    localStorage.removeItem(
        "adminLoggedIn"
    );


    window.location.href =
        "login.html";

}