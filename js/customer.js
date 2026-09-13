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


    // Check customer login

    if (!token || role !== "customer") {

        alert(
            "Please login as a customer first."
        );

        window.location.href =
            "login.html";

    } else {

        const customerName =
            localStorage.getItem("customerName");

        const customerId =
            localStorage.getItem("customerId");


        const nameElement =
            document.getElementById("customerName");

        const idElement =
            document.getElementById("customerId");


        if (nameElement) {

            nameElement.textContent =
                customerName || "Customer";

        }


        if (idElement) {

            idElement.textContent =
                customerId || "-";

        }


        loadVerifiedVendors();

    }

}



// =====================================================
// LOAD VERIFIED VENDORS
// =====================================================

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


        displayVendors(vendors);

    } catch (error) {

        console.error(error);

        vendorList.innerHTML =
            "<p>Unable to load vendors.</p>";

    }

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


    if (!vendors || vendors.length === 0) {

        vendorList.innerHTML =
            "<p>No verified vendors available.</p>";

        return;

    }


    vendors.forEach(function (vendor) {

        const card =
            document.createElement("div");

        card.className = "vendor-card";


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