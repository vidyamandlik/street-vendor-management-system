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
                ).value.trim();


            const enteredMobile =
                document.getElementById(
                    "vendorMobileLogin"
                ).value.trim();


            // Get all vendors

            const vendorData =
                localStorage.getItem(
                    "vendors"
                );


            if (!vendorData) {

                document.getElementById(
                    "vendorLoginError"
                ).textContent =
                    "No vendor registration found.";

                return;

            }


            const vendors =
                JSON.parse(vendorData);


            // Find matching vendor

            const vendor =
                vendors.find(function(v) {

                    return (
                        v.id === enteredId &&
                        v.mobile === enteredMobile
                    );

                });


            if (vendor) {

                // Save login status

                localStorage.setItem(
                    "vendorLoggedIn",
                    "true"
                );


                // Save which vendor logged in

                localStorage.setItem(
                    "loggedInVendorId",
                    vendor.id
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


    // Get logged-in vendor ID

    const loggedInVendorId =
        localStorage.getItem(
            "loggedInVendorId"
        );


    // Find the logged-in vendor

    const vendor =
        vendors.find(function(v) {

            return v.id === loggedInVendorId;

        });


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
// VENDOR EDIT PROFILE
// ===============================

function showEditProfile() {

    const vendors = JSON.parse(
        localStorage.getItem("vendors")
    );

    const loggedInVendorId =
        localStorage.getItem("loggedInVendorId");

    const vendor = vendors.find(function(v) {
        return v.id === loggedInVendorId;
    });

    if (!vendor) {
        return;
    }

    document.getElementById("editName").value = vendor.name;
    document.getElementById("editMobile").value = vendor.mobile;
    document.getElementById("editEmail").value = vendor.email;
    document.getElementById("editBusinessName").value = vendor.businessName;
    document.getElementById("editCategory").value = vendor.category;
    document.getElementById("editDistrict").value = vendor.district;
    document.getElementById("editAddress").value = vendor.address;
    document.getElementById("editYears").value = vendor.years;
    document.getElementById("editDescription").value = vendor.description;

    document.getElementById("editProfileSection").style.display = "block";
}


// ===============================
// VENDOR EDIT PROFILE FORM SUBMISSION
// ===============================

const editProfileForm = document.getElementById("editProfileForm");

if (editProfileForm) {

    editProfileForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const vendors = JSON.parse(
            localStorage.getItem("vendors")
        );

        const loggedInVendorId =
            localStorage.getItem("loggedInVendorId");

        const vendorIndex = vendors.findIndex(function(v) {
            return v.id === loggedInVendorId;
        });

        if (vendorIndex === -1) {
            return;
        }

        vendors[vendorIndex].name =
            document.getElementById("editName").value;

        vendors[vendorIndex].mobile =
            document.getElementById("editMobile").value;

        vendors[vendorIndex].email =
            document.getElementById("editEmail").value;

        vendors[vendorIndex].businessName =
            document.getElementById("editBusinessName").value;

        vendors[vendorIndex].category =
            document.getElementById("editCategory").value;

        vendors[vendorIndex].district =
            document.getElementById("editDistrict").value;

        vendors[vendorIndex].address =
            document.getElementById("editAddress").value;

        vendors[vendorIndex].years =
            document.getElementById("editYears").value;

        vendors[vendorIndex].description =
            document.getElementById("editDescription").value;

        localStorage.setItem(
            "vendors",
            JSON.stringify(vendors)
        );

        alert("Profile updated successfully!");

        location.reload();

    });

}

// ===============================
// VENDOR CANCEL EDIT PROFILE
// ===============================

function cancelEdit() {

    document.getElementById("editProfileSection").style.display = "none";

}


// ===============================
// VENDOR LOGOUT
// ===============================

function vendorLogout() {

    localStorage.removeItem(
        "vendorLoggedIn"
    );

    localStorage.removeItem(
        "loggedInVendorId"
    );

    window.location.href =
        "login.html";

}