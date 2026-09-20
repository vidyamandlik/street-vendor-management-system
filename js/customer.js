// =====================================================
// STREET VENDOR MANAGEMENT SYSTEM - CUSTOMER MODULE
// =====================================================

const API_BASE_URL = "http://localhost:5000/api";

// Utility: HTML Escaping for XSS prevention
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Utility: Debounce for performance optimization on search input
function debounce(func, delay = 250) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Utility: Safely parse JSON response
async function parseJsonResponse(response) {
    try {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (err) {
        console.warn("Failed to parse JSON response:", err);
        return null;
    }
}


// =====================================================
// CUSTOMER REGISTRATION
// =====================================================

const customerRegisterForm = document.getElementById("customerRegisterForm");

if (customerRegisterForm) {
    customerRegisterForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const nameInput = document.getElementById("customerName");
        const mobileInput = document.getElementById("customerMobile");
        const emailInput = document.getElementById("customerEmail");
        const passwordInput = document.getElementById("customerPassword");
        const confirmPasswordInput = document.getElementById("confirmPassword");
        const message = document.getElementById("customerRegisterMessage");
        const submitBtn = customerRegisterForm.querySelector("button[type='submit']");

        const name = nameInput ? nameInput.value.trim() : "";
        const mobile = mobileInput ? mobileInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

        // Reset message
        if (message) {
            message.textContent = "";
            message.style.color = "";
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            if (message) {
                message.textContent = "Passwords do not match.";
                message.style.color = "red";
            }
            return;
        }

        // Loading state
        const originalBtnText = submitBtn ? submitBtn.textContent : "Register";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Registering...";
        }

        try {
            const response = await fetch(`${API_BASE_URL}/customers`, {
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
            });

            const data = await parseJsonResponse(response);

            if (response.ok && data && data.customer) {
                if (message) {
                    message.textContent = `Registration successful! Customer ID: ${data.customer.id}`;
                    message.style.color = "green";
                }

                customerRegisterForm.reset();

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                let errorMsg = (data && data.message) ? data.message : "";
                if (!errorMsg) {
                    if (response.status === 409) {
                        errorMsg = "A customer with this email or mobile already exists.";
                    } else if (response.status === 400) {
                        errorMsg = "Please fill in all required fields properly.";
                    } else if (response.status >= 500) {
                        errorMsg = "Server error occurred during registration. Please try again later.";
                    } else {
                        errorMsg = "Registration failed. Please check your details.";
                    }
                }

                if (message) {
                    message.textContent = errorMsg;
                    message.style.color = "red";
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        } catch (error) {
            console.error("Customer registration error:", error);

            if (message) {
                if (!navigator.onLine) {
                    message.textContent = "You appear to be offline. Please check your internet connection.";
                } else {
                    message.textContent = "Cannot connect to backend server. Please verify the server is running.";
                }
                message.style.color = "red";
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}


// =====================================================
// CUSTOMER LOGIN
// =====================================================

const customerLoginForm = document.getElementById("customerLoginForm");

if (customerLoginForm) {
    customerLoginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const loginIdInput = document.getElementById("customerLoginId");
        const passwordInput = document.getElementById("customerLoginPassword");
        const message = document.getElementById("customerLoginMessage");
        const submitBtn = customerLoginForm.querySelector("button[type='submit']");

        const loginId = loginIdInput ? loginIdInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        // Reset message
        if (message) {
            message.textContent = "";
            message.style.color = "";
        }

        // Quick client-side check
        if (!loginId || !password) {
            if (message) {
                message.textContent = "Please enter both email/mobile and password.";
                message.style.color = "red";
            }
            return;
        }

        // Prevent duplicate submits & set loading state
        const originalBtnText = submitBtn ? submitBtn.textContent : "Login";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Logging in...";
        }

        try {
            const response = await fetch(`${API_BASE_URL}/customers/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    loginId: loginId,
                    password: password
                })
            });

            const data = await parseJsonResponse(response);

            console.log("Customer login response:", data);

            if (response.ok && data && data.token && data.customer) {
                // Save customer session information
                localStorage.setItem("customerToken", data.token);
                localStorage.setItem("customerRole", "customer");
                localStorage.setItem("customerId", data.customer.id);
                localStorage.setItem("customerName", data.customer.name || "Customer");

                if (message) {
                    message.textContent = "Login successful! Redirecting...";
                    message.style.color = "green";
                }

                // Redirect to customer dashboard
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 500);

            } else {
                // Extract error message or build standard HTTP message
                let errorMsg = (data && data.message) ? data.message : "";
                if (!errorMsg) {
                    if (response.status === 400) {
                        errorMsg = "Email/mobile and password are required.";
                    } else if (response.status === 401) {
                        errorMsg = "Invalid email/mobile or password.";
                    } else if (response.status === 404) {
                        errorMsg = "Customer login service not found.";
                    } else if (response.status >= 500) {
                        errorMsg = "Internal server error. Please try again later.";
                    } else {
                        errorMsg = `Login failed (${response.status}). Please try again.`;
                    }
                }

                if (message) {
                    message.textContent = errorMsg;
                    message.style.color = "red";
                }

                // Re-enable button on failure
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }

        } catch (error) {
            console.error("Customer login error:", error);

            if (message) {
                if (!navigator.onLine) {
                    message.textContent = "You appear to be offline. Please check your internet connection.";
                } else {
                    message.textContent = "Cannot connect to backend server. Please ensure the backend is running.";
                }
                message.style.color = "red";
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}


// =====================================================
// CUSTOMER DASHBOARD
// =====================================================

const customerDashboard = document.querySelector(".customer-dashboard");

if (customerDashboard) {
    const token = localStorage.getItem("customerToken");
    const role = localStorage.getItem("customerRole");
    const customerId = localStorage.getItem("customerId");

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
    const idElement = document.getElementById("customerId");
    const profileName = document.getElementById("profileName");
    const welcomeName = document.getElementById("customerName");
    const profileEmail = document.getElementById("profileEmail");

    try {
        const response = await fetch(`${API_BASE_URL}/customers/${encodeURIComponent(customerId)}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Your session has expired or is unauthorized. Please log in again.");
            clearCustomerSession();
            window.location.href = "login.html";
            return;
        }

        const data = await parseJsonResponse(response);

        if (!response.ok || !data) {
            console.error("Customer profile server error:", data);
            if (idElement) idElement.textContent = "-";
            if (profileName) profileName.textContent = "Error loading name";
            if (welcomeName) welcomeName.textContent = localStorage.getItem("customerName") || "Customer";
            if (profileEmail) profileEmail.textContent = "Error loading email";
            return;
        }

        // Populate profile details
        if (idElement) idElement.textContent = data.id || "-";
        if (profileName) profileName.textContent = data.name || "-";
        if (welcomeName) welcomeName.textContent = data.name || "Customer";
        if (profileEmail) profileEmail.textContent = data.email || "-";

    } catch (error) {
        console.error("Error loading customer profile:", error);
        if (idElement) idElement.textContent = "-";
        if (profileName) profileName.textContent = "Unable to connect";
        if (welcomeName) welcomeName.textContent = localStorage.getItem("customerName") || "Customer";
        if (profileEmail) profileEmail.textContent = "Unable to connect";
    }
}


// =====================================================
// LOAD VERIFIED VENDORS
// =====================================================

let allVerifiedVendors = [];

// Cache DOM elements for filters and vendor list
let vendorSearchInput = null;
let vendorCategoryFilter = null;
let vendorDistrictFilter = null;
let vendorListContainer = null;

async function loadVerifiedVendors() {
    vendorListContainer = document.getElementById("vendorList");

    if (!vendorListContainer) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/public/vendors`);
        const vendors = await parseJsonResponse(response);

        if (!response.ok || !Array.isArray(vendors)) {
            vendorListContainer.innerHTML = "<p>Unable to load verified vendors from server. Please try again later.</p>";
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
        console.error("Error loading vendors:", error);
        vendorListContainer.innerHTML = "<p>Unable to connect to backend server. Please verify the server is running.</p>";
    }
}


// =====================================================
// POPULATE DISTRICT FILTER (Optimized with DocumentFragment)
// =====================================================

function populateDistrictFilter(vendors) {
    const districtFilter = document.getElementById("districtFilter");

    if (!districtFilter) {
        return;
    }

    const districts = [...new Set(
        vendors
            .map(vendor => vendor.district)
            .filter(district => typeof district === "string" && district.trim().length > 0)
    )].sort();

    const fragment = document.createDocumentFragment();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "All Districts";
    fragment.appendChild(defaultOption);

    districts.forEach(district => {
        const option = document.createElement("option");
        option.value = district;
        option.textContent = district;
        fragment.appendChild(option);
    });

    districtFilter.innerHTML = "";
    districtFilter.appendChild(fragment);
}


// =====================================================
// VENDOR FILTERS (Debounced & Cached Elements)
// =====================================================

function setupVendorFilters() {
    vendorSearchInput = document.getElementById("vendorSearch");
    vendorCategoryFilter = document.getElementById("categoryFilter");
    vendorDistrictFilter = document.getElementById("districtFilter");

    if (!vendorSearchInput || !vendorCategoryFilter || !vendorDistrictFilter) {
        return;
    }

    // Debounce search input to prevent DOM thrashing on rapid typing
    vendorSearchInput.addEventListener("input", debounce(applyVendorFilters, 200));

    // Immediate change for dropdown filters
    vendorCategoryFilter.addEventListener("change", applyVendorFilters);
    vendorDistrictFilter.addEventListener("change", applyVendorFilters);
}


// =====================================================
// APPLY VENDOR FILTERS
// =====================================================

function applyVendorFilters() {
    if (!vendorSearchInput || !vendorCategoryFilter || !vendorDistrictFilter) {
        vendorSearchInput = document.getElementById("vendorSearch");
        vendorCategoryFilter = document.getElementById("categoryFilter");
        vendorDistrictFilter = document.getElementById("districtFilter");
    }

    const searchText = vendorSearchInput ? vendorSearchInput.value.trim().toLowerCase() : "";
    const selectedCategory = vendorCategoryFilter ? vendorCategoryFilter.value.trim().toLowerCase() : "";
    const selectedDistrict = vendorDistrictFilter ? vendorDistrictFilter.value.trim().toLowerCase() : "";

    const filteredVendors = allVerifiedVendors.filter(vendor => {
        const vendorName = (vendor.name || "").toLowerCase();
        const businessName = (vendor.businessName || "").toLowerCase();
        const vendorCategory = (vendor.category || "").toLowerCase();
        const vendorDistrict = (vendor.district || "").toLowerCase();

        const matchesSearch = !searchText || vendorName.includes(searchText) || businessName.includes(searchText);
        const matchesCategory = !selectedCategory || vendorCategory === selectedCategory;
        const matchesDistrict = !selectedDistrict || vendorDistrict === selectedDistrict;

        return matchesSearch && matchesCategory && matchesDistrict;
    });

    displayVendors(filteredVendors);
}


// =====================================================
// DISPLAY VENDORS (Optimized with DocumentFragment & XSS Protection)
// =====================================================

function displayVendors(vendors) {
    if (!vendorListContainer) {
        vendorListContainer = document.getElementById("vendorList");
    }

    if (!vendorListContainer) {
        return;
    }

    if (!vendors || vendors.length === 0) {
        vendorListContainer.innerHTML = "<p>No vendors found matching your filters.</p>";
        return;
    }

    const fragment = document.createDocumentFragment();

    vendors.forEach(vendor => {
        const card = document.createElement("div");
        card.className = "vendor-card";

        card.innerHTML = `
            <span class="verified-badge">✓ Verified Vendor</span>
            <h3>${escapeHtml(vendor.businessName || "Business")}</h3>
            <p><strong>Owner:</strong> ${escapeHtml(vendor.name || "N/A")}</p>
            <p><strong>Category:</strong> ${escapeHtml(vendor.category || "N/A")}</p>
            <p><strong>Mobile:</strong> ${escapeHtml(vendor.mobile || "N/A")}</p>
            <p><strong>District:</strong> ${escapeHtml(vendor.district || "N/A")}</p>
            <p><strong>Address:</strong> ${escapeHtml(vendor.address || "N/A")}</p>
        `;

        fragment.appendChild(card);
    });

    vendorListContainer.innerHTML = "";
    vendorListContainer.appendChild(fragment);
}


// =====================================================
// CUSTOMER LOGOUT & SESSION MANAGEMENT
// =====================================================

function clearCustomerSession() {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerRole");
    localStorage.removeItem("customerId");
    localStorage.removeItem("customerName");
}

const customerLogout = document.getElementById("customerLogout");

if (customerLogout) {
    customerLogout.addEventListener("click", function (event) {
        event.preventDefault();
        clearCustomerSession();
        window.location.href = "../index.html";
    });
}