// =====================================================
// STREET VENDOR MANAGEMENT SYSTEM - ADMIN MODULE
// =====================================================

const API_BASE_URL = "http://localhost:5000/api";

// In-memory state for fast filtering and statistics
let allVendors = [];
let notificationTimeout = null;
const PAGE_SIZE = 10; // vendors per page
window.currentPage = 1;

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

// HTML Escaping for XSS Prevention
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Debounce for input performance optimization
function debounce(func, delay = 250) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Safely parse JSON from server responses
async function parseJsonResponse(response) {
    try {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (err) {
        console.warn("Failed to parse JSON response:", err);
        return null;
    }
}

// Show alert/notification banner
function showNotification(message, type = "success") {
    const notification = document.getElementById("adminNotification");
    if (!notification) {
        alert(message);
        return;
    }

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    notification.className = `admin-notification ${type}`;
    notification.textContent = message;
    notification.style.display = "block";

    notificationTimeout = setTimeout(() => {
        notification.style.display = "none";
    }, 4000);
}


// =====================================================
// ADMIN LOGIN
// =====================================================

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const usernameInput = document.getElementById("adminUsername");
        const passwordInput = document.getElementById("adminPassword");
        const message = document.getElementById("adminLoginMessage");
        const submitBtn = adminLoginForm.querySelector("button[type='submit']");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        if (message) {
            message.textContent = "";
            message.style.color = "";
        }

        if (!username || !password) {
            if (message) {
                message.textContent = "Please enter both username and password.";
                message.style.color = "red";
            }
            return;
        }

        const originalBtnText = submitBtn ? submitBtn.textContent : "Login";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Logging in...";
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const result = await parseJsonResponse(response);

            if (!response.ok || !result || !result.token) {
                let errorMsg = (result && result.message) ? result.message : "";
                if (!errorMsg) {
                    if (response.status === 401) {
                        errorMsg = "Invalid admin username or password.";
                    } else if (response.status >= 500) {
                        errorMsg = "Admin server error occurred. Please try again later.";
                    } else {
                        errorMsg = "Login failed. Please check your credentials.";
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
                return;
            }

            // Save admin token and role
            localStorage.setItem("token", result.token);
            localStorage.setItem("userRole", result.role || "admin");

            // Open admin dashboard
            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Admin login error:", error);

            if (message) {
                if (!navigator.onLine) {
                    message.textContent = "You are currently offline. Check your network connection.";
                } else {
                    message.textContent = "Unable to connect to the backend server. Please verify it is running.";
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
// ADMIN DASHBOARD INITIALIZATION
// =====================================================

const vendorTableBody = document.getElementById("vendorTableBody");

if (vendorTableBody) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    // Guard: verify admin authorization
    if (!token || userRole !== "admin") {
        alert("Access denied. Admin credentials required.");
        logout();
    } else {
        initAdminDashboard();
    }
}

function initAdminDashboard() {
    // Toolbar search & status filter setup
    const searchInput = document.getElementById("adminVendorSearch");
    const statusFilter = document.getElementById("adminStatusFilter");
    const refreshBtn = document.getElementById("refreshVendorsBtn");

    if (searchInput) {
        searchInput.addEventListener("input", debounce(applyVendorFilters, 200));
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", applyVendorFilters);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadVendorData(true);
        });
    }

    // Event delegation on table body for Approve/Reject action buttons
    vendorTableBody.addEventListener("click", function (event) {
        const actionBtn = event.target.closest(".action-btn");
        if (!actionBtn) return;

        const vendorId = actionBtn.getAttribute("data-id");
        const newStatus = actionBtn.getAttribute("data-action");

        if (vendorId && newStatus) {
            updateVendorStatus(vendorId, newStatus, actionBtn);
        }
    });

    // Initial data fetch
    loadVendorData();

    // Wire up pagination buttons
    setupPaginationListeners();
}


// =====================================================
// LOAD VENDOR DATA
// =====================================================

async function loadVendorData(isManualRefresh = false) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Session expired. Please log in again.");
        logout();
        return;
    }

    // Show loading row if empty or requested
    if (vendorTableBody.children.length === 0 || isManualRefresh) {
        vendorTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-state-cell">
                    Loading registered street vendors...
                </td>
            </tr>
        `;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/vendors`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Your session has expired. Please log in again.");
            logout();
            return;
        }

        const result = await parseJsonResponse(response);

        if (!response.ok || !Array.isArray(result)) {
            const errorMsg = (result && result.message) ? result.message : "Unable to load vendor data from server.";
            vendorTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="table-state-cell error-text">
                        ${escapeHtml(errorMsg)}
                    </td>
                </tr>
            `;
            showNotification(errorMsg, "error");
            return;
        }

        // Store in memory
        allVendors = result;

        // Update statistics cards
        updateStatistics(allVendors);

        // Render filtered table
        applyVendorFilters();

        if (isManualRefresh) {
            showNotification("Vendor applications refreshed successfully.", "success");
        }

    } catch (error) {
        console.error("Error loading vendor data:", error);
        vendorTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-state-cell error-text">
                    Unable to connect to the backend server. Please verify the server is running.
                </td>
            </tr>
        `;
        showNotification("Failed to connect to backend server.", "error");
    }
}


// =====================================================
// FILTER & SEARCH LOGIC
// =====================================================

function applyVendorFilters() {
    const searchInput = document.getElementById("adminVendorSearch");
    const statusFilter = document.getElementById("adminStatusFilter");

    const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedStatus = statusFilter ? statusFilter.value.trim().toLowerCase() : "";

    const filteredVendors = allVendors.filter(vendor => {
        const id = String(vendor.id || "").toLowerCase();
        const name = String(vendor.name || "").toLowerCase();
        const businessName = String(vendor.businessName || "").toLowerCase();
        const category = String(vendor.category || "").toLowerCase();
        const district = String(vendor.district || "").toLowerCase();
        const status = String(vendor.status || "pending").toLowerCase();

        const matchesSearch = !searchText ||
            id.includes(searchText) ||
            name.includes(searchText) ||
            businessName.includes(searchText) ||
            category.includes(searchText) ||
            district.includes(searchText);

        const matchesStatus = !selectedStatus || status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredVendors.length / PAGE_SIZE) || 1;
    // Ensure currentPage is within bounds
    if (window.currentPage > totalPages) window.currentPage = totalPages;
    if (window.currentPage < 1) window.currentPage = 1;

    const startIdx = (window.currentPage - 1) * PAGE_SIZE;
    const paginatedVendors = filteredVendors.slice(startIdx, startIdx + PAGE_SIZE);

    renderVendorTable(paginatedVendors);
    updatePaginationControls(filteredVendors.length, totalPages);
}

function updatePaginationControls(totalItems, totalPages) {
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    const pageInfo = document.getElementById("pageInfo");
    if (prevBtn) prevBtn.disabled = window.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = window.currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${window.currentPage} of ${totalPages}`;
    // Hide pagination if only one page
    const paginationDiv = document.getElementById("adminPagination");
    if (paginationDiv) paginationDiv.style.display = totalPages > 1 ? "block" : "none";
}

function setupPaginationListeners() {
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (window.currentPage > 1) {
                window.currentPage--;
                applyVendorFilters();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            // totalPages recomputed inside applyVendorFilters, just increment if not at end
            window.currentPage++;
            applyVendorFilters();
        });
    }
}




// =====================================================
// DYNAMIC TABLE LAYOUT RENDERING (Optimized with DocumentFragment)
// =====================================================

function renderVendorTable(vendors) {
    if (!vendorTableBody) return;

    if (!vendors || vendors.length === 0) {
        vendorTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-state-cell">
                    No vendors found matching your filter criteria.
                </td>
            </tr>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    vendors.forEach(vendor => {
        const row = document.createElement("tr");
        const status = String(vendor.status || "Pending");
        const normalizedStatus = status.toLowerCase();

        // Status badge pill
        let badgeHtml = "";
        if (normalizedStatus === "verified") {
            badgeHtml = `<span class="status-pill status-verified">&#10003; Verified</span>`;
        } else if (normalizedStatus === "rejected") {
            badgeHtml = `<span class="status-pill status-rejected">&#10005; Rejected</span>`;
        } else {
            badgeHtml = `<span class="status-pill status-pending">&#8987; Pending</span>`;
        }

        // Action buttons tailored to current status
        let actionsHtml = "";
        const escapedId = escapeHtml(vendor.id);

        if (normalizedStatus === "pending") {
            actionsHtml = `
                <button type="button" class="approve-btn action-btn" data-id="${escapedId}" data-action="Verified" title="Approve vendor">
                    Approve
                </button>
                <button type="button" class="reject-btn action-btn" data-id="${escapedId}" data-action="Rejected" title="Reject vendor">
                    Reject
                </button>
            `;
        } else if (normalizedStatus === "verified") {
            actionsHtml = `
                <button type="button" class="reject-btn action-btn" data-id="${escapedId}" data-action="Rejected" title="Revoke verification">
                    Reject
                </button>
            `;
        } else if (normalizedStatus === "rejected") {
            actionsHtml = `
                <button type="button" class="approve-btn action-btn" data-id="${escapedId}" data-action="Verified" title="Re-approve vendor">
                    Approve
                </button>
            `;
        } else {
            actionsHtml = `
                <button type="button" class="approve-btn action-btn" data-id="${escapedId}" data-action="Verified">Approve</button>
                <button type="button" class="reject-btn action-btn" data-id="${escapedId}" data-action="Rejected">Reject</button>
            `;
        }

        row.innerHTML = `
            <td><strong>${escapedId}</strong></td>
            <td>${escapeHtml(vendor.name || "N/A")}</td>
            <td>${escapeHtml(vendor.businessName || "N/A")}</td>
            <td>${escapeHtml(vendor.category || "N/A")}</td>
            <td>${escapeHtml(vendor.district || "N/A")}</td>
            <td>${badgeHtml}</td>
            <td>${actionsHtml}</td>
        `;

        fragment.appendChild(row);
    });

    // Single DOM update
    vendorTableBody.innerHTML = "";
    vendorTableBody.appendChild(fragment);
}


// =====================================================
// UPDATE STATISTICS COUNTERS
// =====================================================

function updateStatistics(vendors) {
    const totalElement = document.getElementById("totalVendors");
    const pendingElement = document.getElementById("pendingVendors");
    const verifiedElement = document.getElementById("verifiedVendors");
    const rejectedElement = document.getElementById("rejectedVendors");

    const total = vendors.length;
    let pending = 0;
    let verified = 0;
    let rejected = 0;

    vendors.forEach(v => {
        const s = String(v.status || "").toLowerCase();
        if (s === "verified") verified++;
        else if (s === "rejected") rejected++;
        else pending++;
    });

    if (totalElement) totalElement.textContent = total;
    if (pendingElement) pendingElement.textContent = pending;
    if (verifiedElement) verifiedElement.textContent = verified;
    if (rejectedElement) rejectedElement.textContent = rejected;
}


// =====================================================
// UPDATE VENDOR APPROVAL STATUS
// =====================================================

async function updateVendorStatus(vendorId, newStatus, buttonElement) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Session expired. Please log in again.");
        logout();
        return;
    }

    const originalText = buttonElement ? buttonElement.textContent : "";
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = "Updating...";
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/vendors/${encodeURIComponent(vendorId)}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (response.status === 401 || response.status === 403) {
            alert("Your session has expired. Please log in again.");
            logout();
            return;
        }

        const result = await parseJsonResponse(response);

        if (!response.ok) {
            throw new Error((result && result.message) || `Failed to update status (${response.status})`);
        }

        // Optimistically update status in memory
        const vendor = allVendors.find(v => v.id === vendorId);
        if (vendor) {
            vendor.status = newStatus;
        }

        // Recalculate statistics and re-render filtered table
        updateStatistics(allVendors);
        applyVendorFilters();

        showNotification(`Vendor ${vendorId} status changed to ${newStatus}.`, "success");

    } catch (error) {
        console.error("Update vendor status error:", error);
        showNotification(error.message || "Failed to update vendor status.", "error");

        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = originalText;
        }
    }
}


// =====================================================
// GLOBAL COMPATIBILITY & LOGOUT
// =====================================================

// Expose approveVendor & rejectVendor for direct inline calls
window.approveVendor = function (vendorId) {
    updateVendorStatus(vendorId, "Verified", null);
};

window.rejectVendor = function (vendorId) {
    updateVendorStatus(vendorId, "Rejected", null);
};

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "login.html";
}

window.logout = logout;
