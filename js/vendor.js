// ===============================
// VENDOR REGISTRATION
// ===============================

const vendorForm = document.getElementById("vendorForm");

if (vendorForm) {

    vendorForm.addEventListener("submit", async function(event) {

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


        try {

            // Send vendor data to backend

            const response = await fetch(
                "http://localhost:5000/api/vendors",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(vendor)
                }
            );


            const result = await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message || "Registration failed"
                );

            }


            // Hide form

            vendorForm.style.display = "none";


            // Show success message

            document.getElementById(
                "successMessage"
            ).style.display = "block";


            document.getElementById(
                "vendorId"
            ).textContent = vendorId;


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            alert(
                "Unable to register vendor. Please try again."
            );

        }

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
        async function(event) {

            event.preventDefault();

            const enteredId =
                document.getElementById(
                    "vendorIdLogin"
                ).value.trim();

            const enteredMobile =
                document.getElementById(
                    "vendorMobileLogin"
                ).value.trim();


            try {

                const response = await fetch(
                    "http://localhost:5000/api/vendors/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            id: enteredId,
                            mobile: enteredMobile
                        })
                    }
                );


                const result =
                    await response.json();


                if (!response.ok) {

                    document.getElementById(
                        "vendorLoginError"
                    ).textContent =
                        result.message ||
                        "Invalid Vendor ID or mobile number.";

                    return;
                }


                // Save login status

                localStorage.setItem(
                    "vendorLoggedIn",
                    "true"
                );


                // Save logged-in vendor ID

                localStorage.setItem(
                    "loggedInVendorId",
                    result.vendor.id
                );


                // Open dashboard

                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                document.getElementById(
                    "vendorLoginError"
                ).textContent =
                    "Unable to connect to server. Please try again.";

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

async function loadVendorDashboard() {

    const loggedInVendorId =
        localStorage.getItem(
            "loggedInVendorId"
        );


    if (!loggedInVendorId) {

        window.location.href =
            "login.html";

        return;

    }


    try {

        // Get vendor information from backend

        const response = await fetch(
            `http://localhost:5000/api/vendors/${loggedInVendorId}`
        );


        const vendor =
            await response.json();


        if (!response.ok) {

            console.error(
                "Vendor not found:",
                vendor.message
            );

            return;

        }


        // Display vendor information

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


        // Display vendor status

        displayVendorStatus(
            vendor.status
        );


    } catch (error) {

        console.error(
            "Error loading vendor:",
            error
        );

    }

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

async function showEditProfile() {

    const loggedInVendorId =
        localStorage.getItem(
            "loggedInVendorId"
        );


    if (!loggedInVendorId) {

        window.location.href =
            "login.html";

        return;

    }


    try {

        // Get current vendor information from MongoDB

        const response = await fetch(
            `http://localhost:5000/api/vendors/${loggedInVendorId}`
        );


        const vendor =
            await response.json();


        if (!response.ok) {

            alert(
                "Unable to load vendor information."
            );

            return;

        }


        // Fill edit form

        document.getElementById(
            "editName"
        ).value =
            vendor.name;


        document.getElementById(
            "editMobile"
        ).value =
            vendor.mobile;


        document.getElementById(
            "editEmail"
        ).value =
            vendor.email;


        document.getElementById(
            "editBusinessName"
        ).value =
            vendor.businessName;


        document.getElementById(
            "editCategory"
        ).value =
            vendor.category;


        document.getElementById(
            "editDistrict"
        ).value =
            vendor.district;


        document.getElementById(
            "editAddress"
        ).value =
            vendor.address;


        document.getElementById(
            "editYears"
        ).value =
            vendor.years;


        document.getElementById(
            "editDescription"
        ).value =
            vendor.description;


        document.getElementById(
            "editProfileSection"
        ).style.display =
            "block";


    } catch (error) {

        console.error(
            "Error loading edit profile:",
            error
        );

        alert(
            "Unable to connect to server."
        );

    }

}

// ===============================
// VENDOR EDIT PROFILE FORM SUBMISSION
// ===============================

const editProfileForm =
    document.getElementById(
        "editProfileForm"
    );

if (editProfileForm) {

    editProfileForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const loggedInVendorId =
                localStorage.getItem(
                    "loggedInVendorId"
                );


            if (!loggedInVendorId) {

                alert(
                    "Vendor session not found."
                );

                window.location.href =
                    "login.html";

                return;

            }


            const updatedVendor = {

                name:
                    document.getElementById(
                        "editName"
                    ).value,

                mobile:
                    document.getElementById(
                        "editMobile"
                    ).value,

                email:
                    document.getElementById(
                        "editEmail"
                    ).value,

                businessName:
                    document.getElementById(
                        "editBusinessName"
                    ).value,

                category:
                    document.getElementById(
                        "editCategory"
                    ).value,

                district:
                    document.getElementById(
                        "editDistrict"
                    ).value,

                address:
                    document.getElementById(
                        "editAddress"
                    ).value,

                years:
                    document.getElementById(
                        "editYears"
                    ).value,

                description:
                    document.getElementById(
                        "editDescription"
                    ).value

            };


            try {

                const response = await fetch(
                    `http://localhost:5000/api/vendors/${loggedInVendorId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                updatedVendor
                            )
                    }
                );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Profile update failed"
                    );

                }


                alert(
                    "Profile updated successfully!"
                );


                location.reload();


            } catch (error) {

                console.error(
                    "Profile update error:",
                    error
                );

                alert(
                    "Unable to update profile. Please try again."
                );

            }

        }
    );

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