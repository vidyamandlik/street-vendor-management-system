// ===============================
// ADMIN LOGIN
// ===============================

const adminLoginForm =
    document.getElementById("adminLoginForm");


if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const username =
                document.getElementById(
                    "adminUsername"
                ).value.trim();


            const password =
                document.getElementById(
                    "adminPassword"
                ).value.trim();


            try {

                const response = await fetch(
                    "http://localhost:5000/api/admin/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            username: username,
                            password: password
                        })
                    }
                );


                const result =
                    await response.json();


                if (!response.ok) {

                    document.getElementById(
                        "loginError"
                    ).textContent =
                        result.message ||
                        "Invalid username or password.";

                    return;

                }


                // Save JWT token

                localStorage.setItem(
                    "token",
                    result.token
                );


                // Save user role

                localStorage.setItem(
                    "userRole",
                    result.role
                );


                // Open admin dashboard

                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(
                    "Admin login error:",
                    error
                );


                document.getElementById(
                    "loginError"
                ).textContent =
                    "Unable to connect to server.";

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

    // Check admin authentication

    const token =
        localStorage.getItem("token");

    const userRole =
        localStorage.getItem("userRole");


    if (!token || userRole !== "admin") {

        alert(
            "Access denied. Admin login required."
        );

        window.location.href =
            "login.html";

    } else {

        loadVendorData();

    }

}

// ===============================
// LOAD VENDOR DATA
// ===============================

async function loadVendorData() {

    const token =
        localStorage.getItem("token");


    if (!token) {

        alert("Access denied. Please login again.");

        window.location.href =
            "login.html";

        return;

    }


    try {

        const response = await fetch(

            "http://localhost:5000/api/vendors",

            {
                headers: {

                    Authorization:
                        `Bearer ${token}`

                }
            }

        );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Unable to load vendor data."
            );

            // If token is invalid/expired

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem("token");
                localStorage.removeItem("userRole");

                window.location.href =
                    "login.html";

            }

            return;

        }


        // MongoDB vendor data

        const vendors = result;


        updateStatistics(vendors);

        displayVendors(vendors);


    } catch (error) {

        console.error(
            "Error loading vendor data:",
            error
        );

        alert(
            "Unable to connect to the server."
        );

    }

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

async function approveVendor(vendorId) {

    try {

        const response = await fetch(
            `http://localhost:5000/api/vendors/${vendorId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: "Verified"
                })
            }
        );


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to approve vendor"
            );

        }


        alert(
            "Vendor approved successfully!"
        );


        loadVendorData();


    } catch (error) {

        console.error(
            "Approve vendor error:",
            error
        );

        alert(
            "Unable to approve vendor. Please try again."
        );

    }

}


// ===============================
// REJECT VENDOR
// ===============================

async function rejectVendor(vendorId) {

    try {

        const response = await fetch(
            `http://localhost:5000/api/vendors/${vendorId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: "Rejected"
                })
            }
        );


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to reject vendor"
            );

        }


        alert(
            "Vendor rejected."
        );


        loadVendorData();


    } catch (error) {

        console.error(
            "Reject vendor error:",
            error
        );

        alert(
            "Unable to reject vendor. Please try again."
        );

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