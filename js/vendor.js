const vendorForm = document.getElementById("vendorForm");

if (vendorForm) {

    vendorForm.addEventListener("submit", function(event) {

        event.preventDefault();


        // Generate Vendor ID

        const vendorId =
            "VND-" +
            Math.floor(1000 + Math.random() * 9000);


        // Collect vendor information

        const vendor = {

            id: vendorId,

            name:
                document.getElementById("vendorName").value,

            mobile:
                document.getElementById("mobile").value,

            email:
                document.getElementById("email").value,

            businessName:
                document.getElementById("businessName").value,

            category:
                document.getElementById("category").value,

            district:
                document.getElementById("district").value,

            address:
                document.getElementById("address").value,

            years:
                document.getElementById("years").value,

            description:
                document.getElementById("description").value,

            status: "Pending"

        };


        // Get existing vendors

let vendors =
    JSON.parse(
        localStorage.getItem("vendors")
    ) || [];


// Add new vendor

vendors.push(vendor);


// Save all vendors

localStorage.setItem(
    "vendors",
    JSON.stringify(vendors)
);

       


        // Hide form

        vendorForm.style.display = "none";


        // Show success message

        document.getElementById(
            "successMessage"
        ).style.display = "block";


        document.getElementById(
            "vendorId"
        ).textContent = vendorId;

    });

}
// ===============================
// VENDOR LOGIN
// ===============================

const vendorLoginForm =
    document.getElementById(
        "vendorLoginForm"
    );


if (vendorLoginForm) {

    vendorLoginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const enteredId =
                document.getElementById(
                    "vendorIdLogin"
                ).value;


            const enteredMobile =
                document.getElementById(
                    "vendorMobileLogin"
                ).value;


            const vendorData =
                localStorage.getItem(
                    "vendorData"
                );


            if (!vendorData) {

                document.getElementById(
                    "vendorLoginError"
                ).textContent =
                    "No vendor registration found.";

                return;

            }


            const vendor =
                JSON.parse(vendorData);


            if (
                enteredId === vendor.id &&
                enteredMobile === vendor.mobile
            ) {

                localStorage.setItem(
                    "vendorLoggedIn",
                    "true"
                );


                window.location.href =
                    "dashboard.html";

            }

            else {

                document.getElementById(
                    "vendorLoginError"
                ).textContent =
                    "Invalid Vendor ID or mobile number.";

            }

        }
    );

}
// ===============================
// VENDOR DASHBOARD
// ===============================

const vendorDashboard =
    document.querySelector(
        ".vendor-dashboard"
    );


if (vendorDashboard) {


    const loggedIn =
        localStorage.getItem(
            "vendorLoggedIn"
        );


    if (loggedIn !== "true") {

        window.location.href =
            "login.html";

    }


    loadVendorDashboard();

}


// ===============================
// LOAD VENDOR INFORMATION
// ===============================

function loadVendorDashboard() {

    const vendorData =
        localStorage.getItem("vendors");


    if (!vendorData) {
        return;
    }


    const vendors =
        JSON.parse(vendorData);


    // For prototype:
    // display the first registered vendor

    const vendor = vendors[0];


    if (!vendor) {
        return;
    }


    document.getElementById(
        "vendorName"
    ).textContent =
        vendor.name;


    document.getElementById(
        "vendorId"
    ).textContent =
        vendor.id;


    document.getElementById(
        "businessName"
    ).textContent =
        vendor.businessName;


    document.getElementById(
        "category"
    ).textContent =
        vendor.category;


    document.getElementById(
        "mobile"
    ).textContent =
        vendor.mobile;


    document.getElementById(
        "email"
    ).textContent =
        vendor.email;


    document.getElementById(
        "district"
    ).textContent =
        vendor.district;


    document.getElementById(
        "years"
    ).textContent =
        vendor.years;


    document.getElementById(
        "address"
    ).textContent =
        vendor.address;


    document.getElementById(
        "description"
    ).textContent =
        vendor.description;


    displayVendorStatus(
        vendor.status
    );

}


// ===============================
// DISPLAY STATUS
// ===============================

function displayVendorStatus(status) {


    const statusElement =
        document.getElementById(
            "vendorStatus"
        );


    if (status === "Verified") {

        statusElement.innerHTML = `
            <div class="verified-status">
                ✓ Verified Vendor
            </div>
        `;

    }

    else if (status === "Rejected") {

        statusElement.innerHTML = `
            <div class="rejected-status">
                ✕ Application Rejected
            </div>
        `;

    }

    else {

        statusElement.innerHTML = `
            <div class="pending-status">
                ⏳ Pending Verification
            </div>
        `;

    }

}


// ===============================
// VENDOR LOGOUT
// ===============================

function vendorLogout() {


    localStorage.removeItem(
        "vendorLoggedIn"
    );


    window.location.href =
        "login.html";

}