// =====================================================
// STREET VENDOR MANAGEMENT SYSTEM - BACKEND SERVER
// =====================================================

const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const {
    randomUUID,
    randomBytes,
    scrypt,
    timingSafeEqual
} = require("crypto");
const { promisify } = require("util");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, ".env")
});


// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in backend/.env.");
}

const PORT = process.env.PORT || 5000;

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017";


// =====================================================
// APP
// =====================================================

const app = express();

if (process.env.NODE_ENV === "production" || process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
}


// =====================================================
// ALLOWED CORS ORIGINS
// =====================================================

const ALLOWED_ORIGINS = (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:5500," +
    "http://127.0.0.1:5500," +
    "http://localhost:3000," +
    "http://127.0.0.1:3000," +
    "http://localhost:5173," +
    "http://127.0.0.1:5173"
)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);


// =====================================================
// CORS
// IMPORTANT:
// Do NOT add app.options("*", cors()) in Express 5.
// cors middleware itself handles preflight requests.
// =====================================================

app.use(
    cors({
        origin: (origin, callback) => {

            //console.log("REQUEST ORIGIN:", origin);

            // Allow:
            // - requests without origin
            // - file:// origin during local testing
            // - allowed localhost/127.0.0.1 origins
            if (
                !origin ||
                origin === "null" ||
                ALLOWED_ORIGINS.includes(origin)
            ) {
                callback(null, true);
            } else {
                console.log("BLOCKED ORIGIN:", origin);
                callback(new Error("Origin is not allowed by CORS."));
            }
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// =====================================================
// JSON BODY
// =====================================================

app.use(express.json());
function isValidMobile(value) {
    return typeof value === "string" && /^[0-9]{10}$/.test(value.trim());
}

function isValidEmail(value) {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    // Safe standard RFC 5322 compatible regex
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(trimmed);
}

function allStrings(...values) {
    return values.every(v => typeof v === "string");
}

const ALLOWED_VENDOR_CATEGORIES = [
    "Food",
    "Fruits and Vegetables",
    "Clothing",
    "Accessories",
    "Grocery",
    "Other"
];

function isValidVendorCategory(value) {
    return typeof value === "string" && ALLOWED_VENDOR_CATEGORIES.includes(value.trim());
}

function formatDistrict(district) {
    if (!district || typeof district !== "string") return "";
    return district
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}


// =====================================================
// PASSWORD HASHING
// =====================================================

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {

    const salt = randomBytes(16).toString("hex");

    const derivedKey = await scryptAsync(
        password,
        salt,
        64
    );

    return `${salt}:${derivedKey.toString("hex")}`;
}


async function verifyPassword(password, storedPassword) {

    if (
        typeof storedPassword !== "string" ||
        !storedPassword.includes(":")
    ) {
        return false;
    }

    const [salt, storedHash] =
        storedPassword.split(":");

    const derivedKey =
        await scryptAsync(
            password,
            salt,
            64
        );

    const storedKey =
        Buffer.from(
            storedHash,
            "hex"
        );

    return (
        storedKey.length === derivedKey.length &&
        timingSafeEqual(
            storedKey,
            derivedKey
        )
    );
}


// =====================================================
// LOGIN RATE LIMITER
// =====================================================

const loginAttempts = new Map();

function limitLoginAttempts(req, res, next) {

    const key =
        `${req.ip}:${req.path}`;

    const now = Date.now();

    const windowMs =
        15 * 60 * 1000;

    const maxAttempts = 10;

    const attempts =
        (
            loginAttempts.get(key) || []
        ).filter(
            time =>
                now - time < windowMs
        );

    if (attempts.length >= maxAttempts) {

        return res.status(429).json({
            message:
                "Too many login attempts. Please try again later."
        });
    }

    res.on("finish", () => {

        if (
            res.statusCode >= 400 &&
            res.statusCode < 500
        ) {

            attempts.push(now);

            loginAttempts.set(
                key,
                attempts
            );
        }
    });

    next();
}


// =====================================================
// REGISTRATION RATE LIMITER
// =====================================================

const registrationAttempts = new Map();

function limitRegistrationAttempts(req, res, next) {

    const ip =
        req.ip ||
        req.socket?.remoteAddress ||
        "unknown";

    const key = `register:${ip}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5; // Allow at most 5 registration requests per 15 min per IP

    const attempts =
        (
            registrationAttempts.get(key) || []
        ).filter(
            time =>
                now - time < windowMs
        );

    if (attempts.length >= maxAttempts) {

        return res.status(429).json({
            message:
                "Too many registration attempts from this IP. Please try again after 15 minutes."
        });
    }

    attempts.push(now);
    registrationAttempts.set(key, attempts);

    // Periodically clean up stale entries if map grows large
    if (registrationAttempts.size > 10000) {
        for (const [k, v] of registrationAttempts.entries()) {
            const fresh = v.filter(t => now - t < windowMs);
            if (fresh.length === 0) {
                registrationAttempts.delete(k);
            } else {
                registrationAttempts.set(k, fresh);
            }
        }
    }

    next();
}


// =====================================================
// REVIEW SUBMISSION RATE LIMITER
// =====================================================

const reviewAttempts = new Map();

function limitReviewAttempts(req, res, next) {

    const ip =
        req.ip ||
        req.socket?.remoteAddress ||
        "unknown";

    const customerId =
        req.user?.id ||
        req.user?.customerId ||
        "anonymous";

    const key = `review:${customerId}:${ip}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 15; // Allow at most 15 review submissions per 15 min

    const attempts =
        (
            reviewAttempts.get(key) || []
        ).filter(
            time =>
                now - time < windowMs
        );

    if (attempts.length >= maxAttempts) {

        return res.status(429).json({
            message:
                "Too many review submissions. Please try again after 15 minutes."
        });
    }

    attempts.push(now);
    reviewAttempts.set(key, attempts);

    // Periodically clean up stale entries if map grows large
    if (reviewAttempts.size > 10000) {
        for (const [k, v] of reviewAttempts.entries()) {
            const fresh = v.filter(t => now - t < windowMs);
            if (fresh.length === 0) {
                reviewAttempts.delete(k);
            } else {
                reviewAttempts.set(k, fresh);
            }
        }
    }

    next();
}


// =====================================================
// MONGODB
// =====================================================

const client =
    new MongoClient(MONGODB_URI);

const DB_NAME =
    process.env.DB_NAME || "streetVendorDB";

const db =
    client.db(DB_NAME);

const vendorsCollection =
    db.collection("vendors");

const customersCollection =
    db.collection("customers");

const reviewsCollection =
    db.collection("reviews");


// =====================================================
// JWT AUTHENTICATION
// =====================================================

function authenticateToken(
    req,
    res,
    next
) {

    const authHeader =
        req.headers.authorization;

    const token =
        authHeader &&
        authHeader.split(" ")[1];

    if (!token) {

        return res.status(401).json({
            message:
                "Access denied. Please login first."
        });
    }

    try {

        const user =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.user = user;

        next();

    } catch (error) {

        return res.status(403).json({
            message:
                "Invalid or expired token."
        });
    }
}


function authorizeRole(role) {

    return (req, res, next) => {

        if (
            !req.user ||
            req.user.role !== role
        ) {

            return res.status(403).json({
                message:
                    "You are not authorized to access this resource."
            });
        }

        next();
    };
}


// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {

    res.send(
        "Street Vendor Management System Backend is running!"
    );
});


// =====================================================
// ADMIN LOGIN
// =====================================================

app.post(
    "/api/admin/login",
    limitLoginAttempts,
    async (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;

            if (
                !username ||
                !password
            ) {

                return res.status(400).json({
                    message:
                        "Username and password are required."
                });
            }

            if (
                username !==
                process.env.ADMIN_USERNAME
            ) {

                return res.status(401).json({
                    message:
                        "Invalid admin credentials."
                });
            }

            const valid =
                await verifyPassword(
                    password,
                    process.env.ADMIN_PASSWORD_HASH
                );

            if (!valid) {

                return res.status(401).json({
                    message:
                        "Invalid admin credentials."
                });
            }

            const token =
                jwt.sign(
                    {
                        username,
                        role: "admin"
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: "2h"
                    }
                );

            res.json({
                message:
                    "Admin login successful.",
                token,
                role: "admin"
            });

        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error during admin login."
            });
        }
    }
);


// =====================================================
// GET ALL VERIFIED VENDORS
// =====================================================

app.get(
    "/api/vendors",
    async (req, res) => {

        try {

            const vendors =
                await vendorsCollection
                    .find({
                        status: "Verified"
                    })
                    .project({
                        password: 0, email: 0
                    })
                    .toArray();

            res.json(vendors);

        } catch (error) {

            console.error(
                "Get vendors error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch vendors."
            });
        }
    }
);


// =====================================================
// ADMIN - GET ALL VENDORS
// =====================================================

app.get(
    "/api/admin/vendors",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res) => {

        try {

            const vendors =
                await vendorsCollection
                    .find({})
                    .project({
                        password: 0, email: 0
                    })
                    .toArray();

            res.json(vendors);

        } catch (error) {

            console.error(
                "Admin get vendors error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch vendors."
            });
        }
    }
);


// =====================================================
// GENERATE VENDOR ID
// =====================================================

async function generateVendorId() {

    let vendorId;
    let exists = true;

    while (exists) {

        const number =
            Math.floor(
                1000 +
                Math.random() * 9000
            );

        vendorId =
            `VND-${number}`;

        const existing =
            await vendorsCollection.findOne({
                id: vendorId
            });

        exists = Boolean(existing);
    }

    return vendorId;
}


// =====================================================
// VENDOR REGISTRATION
// =====================================================

app.post(
    "/api/vendors",
    limitRegistrationAttempts,
    async (req, res) => {

        try {

            const {
                name,
                mobile,
                email,
                password,
                confirmPassword,
                businessName,
                category,
                district,
                address,
                years,
                description
            } = req.body;

            if (!allStrings(name, mobile, email, password, confirmPassword,
                businessName, category, district,
                address, description)) {
                return res.status(400).json({
                    message: "Invalid data in the form."
                });
            }

            if (
                !name.trim() ||
                !mobile.trim() ||
                !email.trim() ||
                !password ||
                !confirmPassword ||
                !businessName.trim() ||
                !category.trim() ||
                !district.trim() ||
                !address.trim() ||
                years === undefined ||
                years === null ||
                String(years).trim() === "" ||
                !description.trim()
            ) {
                return res.status(400).json({
                    message:
                        "All required fields must be filled."
                });
            }

if (!isValidMobile(mobile)) {
    return res.status(400).json({
        message: "Mobile number must be exactly 10 digits."
    });
}

if (!isValidEmail(email)) {
    return res.status(400).json({
        message: "Please enter a valid email address."
    });
}

const yearsNumber = Number(years);
if (!Number.isFinite(yearsNumber) || yearsNumber < 0 || yearsNumber > 100) {
    return res.status(400).json({
        message: "Years must be a number between 0 and 100."
    });
}

if (!isValidVendorCategory(category)) {
    return res.status(400).json({
        message: "Invalid business category selected."
    });
}

            if (password.length < 8) {

                return res.status(400).json({
                    message:
                        "Password must be at least 8 characters."
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    message: "Passwords do not match."
                });
            }

            const existing =
                await vendorsCollection.findOne({
                    $or: [
                       { email: email.trim().toLowerCase() },
                       { mobile: mobile.trim() }
                      ]
                });

            if (existing) {

                return res.status(409).json({
                    message:
                        "Email or mobile number already registered."
                });
            }

            const hashedPassword =
                await hashPassword(password);

            const vendor = {

                name: name.trim(),

                mobile: mobile.trim(),

                email: email.trim().toLowerCase(),

                password: hashedPassword,

                businessName:
                    businessName.trim(),

                category:
                    category.trim(),

                district:
                    formatDistrict(district),

                address:
                    address.trim(),

                years:
                    Number(years),

                description:
                    description.trim(),

                status: "Pending",

                createdAt: new Date()
            };

            let vendorId;
            let inserted = false;
            let attempts = 0;
            const maxAttempts = 3;

            while (!inserted && attempts < maxAttempts) {
                attempts++;
                vendorId = await generateVendorId();
                vendor.id = vendorId;

                try {
                    await vendorsCollection.insertOne(vendor);
                    inserted = true;
                } catch (insertError) {
                    const isIdCollision =
                        insertError &&
                        insertError.code === 11000 &&
                        (
                            insertError.keyPattern?.id ||
                            (typeof insertError.message === "string" && insertError.message.includes("id_1"))
                        );

                    if (isIdCollision && attempts < maxAttempts) {
                        continue;
                    }
                    throw insertError;
                }
            }

            res.status(201).json({
                message:
                    "Vendor registered successfully. Your account is pending verification.",
                vendorId
            });

        } catch (error) {

            if (error && error.code === 11000) {
                const isIdCollision =
                    error.keyPattern?.id ||
                    (typeof error.message === "string" && error.message.includes("id_1"));

                if (isIdCollision) {
                    console.error("Vendor ID collision could not be resolved after retries:", error);
                    return res.status(500).json({
                        message: "Failed to generate a unique Vendor ID. Please try again."
                    });
                }

                return res.status(409).json({
                    message: "Email or mobile number already registered."
                });
            }
            console.error(
                "Vendor registration error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to register vendor."
            });
        }
    }
);


// =====================================================
// VENDOR PROFILE
// =====================================================

app.get(
    "/api/vendors/:id",
    authenticateToken,
    authorizeRole("vendor"),
    async (req, res) => {

        try {

            const vendorId =
                req.params.id;

            if (
                req.user.id !== vendorId
            ) {

                return res.status(403).json({
                    message:
                        "You can only access your own profile."
                });
            }

            const vendor =
                await vendorsCollection.findOne(
                    {
                        id: vendorId
                    },
                    {
                        projection: {
                            password: 0
                        }
                    }
                );

            if (!vendor) {

                return res.status(404).json({
                    message:
                        "Vendor not found."
                });
            }

            res.json(vendor);

        } catch (error) {

            console.error(
                "Vendor profile error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch vendor profile."
            });
        }
    }
);


// =====================================================
// VENDOR UPDATE PROFILE
// =====================================================

app.put(
    "/api/vendors/:id",
    authenticateToken,
    authorizeRole("vendor"),
    async (req, res) => {

        try {

            const vendorId =
                req.params.id;

            if (
                req.user.id !== vendorId
            ) {

                return res.status(403).json({
                    message:
                        "You can only update your own profile."
                });
            }

            const {
                name,
                mobile,
                email,
                businessName,
                category,
                district,
                address,
                years,
                description
            } = req.body;
              const provided = [name, mobile, email, businessName,
                    category, district, address, description]
                   .filter(v => v !== undefined);

  if (!allStrings(...provided)) {
      return res.status(400).json({ message: "Invalid data." });
  }
  if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ message: "Name cannot be empty." });
  }
  if (businessName !== undefined && businessName.trim() === "") {
      return res.status(400).json({ message: "Business name cannot be empty." });
  }
  if (category !== undefined && !isValidVendorCategory(category)) {
      return res.status(400).json({ message: "Invalid business category selected." });
  }
  if (district !== undefined && district.trim() === "") {
      return res.status(400).json({ message: "District cannot be empty." });
  }
  if (address !== undefined && address.trim() === "") {
      return res.status(400).json({ message: "Address cannot be empty." });
  }
  if (mobile !== undefined && !isValidMobile(mobile)) {
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits." });
  }
  if (email !== undefined && !isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
  }
  if (years !== undefined) {
      const y = Number(years);
      if (!Number.isFinite(y) || y < 0 || y > 100) {
          return res.status(400).json({ message: "Years must be between 0 and 100." });
      }
  }

            const updateData = {};

            if (name !== undefined)
                updateData.name = name.trim();

            if (mobile !== undefined)
                updateData.mobile = mobile.trim();

            if (email !== undefined)
                updateData.email =
                    email.trim().toLowerCase();

            if (businessName !== undefined)
                updateData.businessName =
                    businessName.trim();

            if (category !== undefined)
                updateData.category =
                    category.trim();

            if (district !== undefined)
                updateData.district =
                    formatDistrict(district);

            if (address !== undefined)
                updateData.address =
                    address.trim();

            if (years !== undefined)
                updateData.years =
                    Number(years);

            if (description !== undefined)
                updateData.description =
                    description.trim();

            if (Object.keys(updateData).length === 0) {

                return res.status(400).json({
                    message:
                        "No fields provided for update."
                });
            }

            const duplicateConditions = [];

            if (mobile !== undefined) {
                duplicateConditions.push({
                    mobile:
                        mobile.trim()
                });
            }

            if (email !== undefined) {
                duplicateConditions.push({
                    email:
                        email.trim().toLowerCase()
                });
            }

            if (
                duplicateConditions.length > 0
            ) {

                const duplicate =
                    await vendorsCollection.findOne({
                        id: {
                            $ne: vendorId
                        },
                        $or:
                            duplicateConditions
                    });

                if (duplicate) {

                    return res.status(409).json({
                        message:
                            "Email or mobile number is already used by another vendor."
                    });
                }
            }

            const result =
                await vendorsCollection.updateOne(
                    {
                        id: vendorId
                    },
                    {
                        $set:
                            updateData
                    }
                );

            if (result.matchedCount === 0) {

                return res.status(404).json({
                    message:
                        "Vendor not found."
                });
            }

            res.json({
                message:
                    "Vendor profile updated successfully."
            });

        } catch (error) {

            console.error(
                "Vendor update error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to update vendor profile."
            });
        }
    }
);


// =====================================================
// VENDOR SHOP DETAILS
// =====================================================

// =====================================================
// VENDOR SHOP DETAILS
// =====================================================

// =====================================================
// VENDOR SHOP DETAILS
// =====================================================

app.put(
    "/api/vendors/:id/shop-details",
    authenticateToken,
    authorizeRole("vendor"),
    async (req, res) => {

        try {

            const vendorId = req.params.id;

            // Vendor can update only own shop details
            if (req.user.id !== vendorId) {

                return res.status(403).json({
                    message:
                        "You can only update your own shop details."
                });
            }

            const {
                days,
                closingDay,
                products,
                openingTime,
                closingTime,
                description,
                address,
                contact,
                additionalInformation
            } = req.body;

            // Validate optional shop info fields if provided
            if (description !== undefined && description !== null) {
                if (typeof description !== "string") {
                    return res.status(400).json({
                        message: "Shop description must be a string."
                    });
                }
                if (description.length > 500) {
                    return res.status(400).json({
                        message: "Shop description cannot exceed 500 characters."
                    });
                }
            }

            if (address !== undefined && address !== null) {
                if (typeof address !== "string") {
                    return res.status(400).json({
                        message: "Shop address must be a string."
                    });
                }
                if (address.length > 500) {
                    return res.status(400).json({
                        message: "Shop address cannot exceed 500 characters."
                    });
                }
            }

            if (contact !== undefined && contact !== null) {
                if (typeof contact !== "string") {
                    return res.status(400).json({
                        message: "Shop contact must be a string."
                    });
                }
                const trimmedContact = contact.trim();
                if (trimmedContact !== "" && !isValidMobile(trimmedContact)) {
                    return res.status(400).json({
                        message: "Shop contact number must be exactly 10 digits."
                    });
                }
            }

            if (additionalInformation !== undefined && additionalInformation !== null) {
                if (typeof additionalInformation !== "string") {
                    return res.status(400).json({
                        message: "Additional information must be a string."
                    });
                }
                if (additionalInformation.length > 1000) {
                    return res.status(400).json({
                        message: "Additional information cannot exceed 1000 characters."
                    });
                }
            }

            // Validate arrays
            if (!Array.isArray(days)) {

                return res.status(400).json({
                    message:
                        "Opening days must be an array."
                });
            }

            if (!Array.isArray(products)) {

                return res.status(400).json({
                    message:
                        "Products must be an array."
                });
            }

            // Validate closing day
            if (
                typeof closingDay !== "string" ||
                !closingDay.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Closing day is required."
                });
            }

            // Validate opening time
            if (
                typeof openingTime !== "string" ||
                !openingTime.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Opening time is required."
                });
            }

            // Validate closing time
            if (
                typeof closingTime !== "string" ||
                !closingTime.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Closing time is required."
                });
            }

            // Validate products
            const validatedProducts = [];
            const seenProductNames = new Set();

            for (let i = 0; i < products.length; i++) {
                const product = products[i];

                if (
                    typeof product !== "object" ||
                    product === null ||
                    Array.isArray(product)
                ) {
                    return res.status(400).json({
                        message: `Product at index ${i} must be a valid object.`
                    });
                }

                if (typeof product.name !== "string") {
                    return res.status(400).json({
                        message: `Product at index ${i} must have a valid string name.`
                    });
                }

                const trimmedName = product.name.trim();

                if (!trimmedName) {
                    return res.status(400).json({
                        message: `Product at index ${i} name cannot be empty.`
                    });
                }

                if (trimmedName.length > 100) {
                    return res.status(400).json({
                        message: `Product "${trimmedName}" name cannot exceed 100 characters.`
                    });
                }

                const normalizedName = trimmedName.toLowerCase();

                if (seenProductNames.has(normalizedName)) {
                    return res.status(400).json({
                        message: `Duplicate product name: "${trimmedName}". Product names must be unique.`
                    });
                }
                seenProductNames.add(normalizedName);

                let description = "";
                if (
                    product.description !== undefined &&
                    product.description !== null
                ) {
                    if (typeof product.description !== "string") {
                        return res.status(400).json({
                            message: `Product "${trimmedName}" description must be a string.`
                        });
                    }

                    if (product.description.length > 300) {
                        return res.status(400).json({
                            message: `Product "${trimmedName}" description cannot exceed 300 characters.`
                        });
                    }

                    description = product.description.trim();
                }

                let available = true;
                if (
                    product.available !== undefined &&
                    product.available !== null
                ) {
                    if (typeof product.available !== "boolean") {
                        return res.status(400).json({
                            message: `Product "${trimmedName}" available field must be a boolean.`
                        });
                    }

                    available = product.available;
                }

                const validatedProduct = {
                    name: trimmedName,
                    description: description,
                    available: available
                };

                if (
                    product.price !== undefined &&
                    product.price !== null &&
                    product.price !== ""
                ) {
                    const numPrice = typeof product.price === "number" ? product.price : Number(product.price);

                    if (!Number.isFinite(numPrice) || numPrice < 0) {
                        return res.status(400).json({
                            message: `Product "${trimmedName}" price must be a finite, non-negative number.`
                        });
                    }

                    validatedProduct.price = numPrice;
                }

                validatedProducts.push(validatedProduct);
            }

            // Check if vendor exists
            const existingVendor =
                await vendorsCollection.findOne({
                    id: vendorId
                });

            if (!existingVendor) {
                return res.status(404).json({
                    message:
                        "Vendor not found."
                });
            }

            const existingShopDetails =
                existingVendor.shopDetails &&
                typeof existingVendor.shopDetails === "object" &&
                !Array.isArray(existingVendor.shopDetails)
                    ? existingVendor.shopDetails
                    : {};

            const updatedShopDetails = {
                ...existingShopDetails,
                days: days,
                closingDay: closingDay.trim(),
                products: validatedProducts,
                openingTime: openingTime.trim(),
                closingTime: closingTime.trim(),
                updatedAt: new Date()
            };

            if (description !== undefined) {
                updatedShopDetails.description = description !== null ? description.trim() : "";
            }

            if (address !== undefined) {
                updatedShopDetails.address = address !== null ? address.trim() : "";
            }

            if (contact !== undefined) {
                updatedShopDetails.contact = contact !== null ? contact.trim() : "";
            }

            if (additionalInformation !== undefined) {
                updatedShopDetails.additionalInformation = additionalInformation !== null ? additionalInformation.trim() : "";
            }

            // Save shop details
            const result =
                await vendorsCollection.updateOne(
                    {
                        id: vendorId
                    },
                    {
                        $set: {
                            shopDetails: updatedShopDetails
                        }
                    }
                );

            if (result.matchedCount === 0) {

                return res.status(404).json({
                    message:
                        "Vendor not found."
                });
            }

            res.json({
                message:
                    "Shop details updated successfully.",
                shopDetails: updatedShopDetails
            });

        } catch (error) {

            console.error(
                "Shop details error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to update shop details."
            });
        }
    }
);

// =====================================================
// ADMIN - UPDATE VENDOR STATUS
// =====================================================

app.put(
    "/api/admin/vendors/:id/status",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res) => {

        try {

            const vendorId =
                req.params.id;

            const {
                status
            } = req.body;

            const allowedStatuses = [
                "Pending",
                "Verified",
                "Rejected"
            ];

            if (
                !allowedStatuses.includes(status)
            ) {

                return res.status(400).json({
                    message:
                        "Invalid vendor status."
                });
            }

            const result =
                await vendorsCollection.updateOne(
                    {
                        id: vendorId
                    },
                    {
                        $set: {
                            status
                        }
                    }
                );

            if (result.matchedCount === 0) {

                return res.status(404).json({
                    message:
                        "Vendor not found."
                });
            }

            res.json({
                message:
                    `Vendor status updated to ${status}.`
            });

        } catch (error) {

            console.error(
                "Vendor status error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to update vendor status."
            });
        }
    }
);


// =====================================================
// VENDOR LOGIN
// =====================================================

app.post(
    "/api/vendors/login",
    limitLoginAttempts,
    async (req, res) => {

        try {

            const {
                id,
                password
            } = req.body;

            if (!id || !password) {
                return res.status(400).json({
                    message: "Vendor ID and password are required."
                });
            }

            if (!allStrings(id, password)) {
                return res.status(400).json({
                    message: "Invalid login data."
                });
            }

            const vendor =
                await vendorsCollection.findOne({
                    id: id.trim()
                });

            if (!vendor) {

                return res.status(401).json({
                    message:
                        "Invalid Vendor ID or password."
                });
            }

            const valid =
                await verifyPassword(
                    password,
                    vendor.password
                );

            if (!valid) {

                return res.status(401).json({
                    message:
                        "Invalid Vendor ID or password."
                });
            }

            const token =
                jwt.sign(
                    {
                        id: vendor.id,
                        role: "vendor",
                        name: vendor.name
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: "2h"
                    }
                );

            res.json({

                message:
                    "Vendor login successful.",

                token,

                role: "vendor",

                vendor: {
                    id: vendor.id,
                    name: vendor.name,
                    businessName:
                        vendor.businessName,
                    status:
                        vendor.status
                }
            });

        } catch (error) {

            console.error(
                "Vendor login error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error during vendor login."
            });
        }
    }
);


// =====================================================
// PUBLIC VERIFIED VENDORS
// =====================================================

app.get(
    "/api/public/vendors",
    async (req, res) => {

        try {

            const vendors =
                await vendorsCollection
                    .find({
                        status: "Verified"
                    })
                    .project({
                        password: 0, email: 0
                    })
                    .toArray();

            res.json(vendors);

        } catch (error) {

            console.error(
                "Public vendors error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch public vendors."
            });
        }
    }
);


// =====================================================
// PUBLIC SINGLE VENDOR
// =====================================================

app.get(
    "/api/public/vendors/:id",
    async (req, res) => {

        try {

            const vendorId =
                req.params.id;

            const vendor =
                await vendorsCollection.findOne(
                    {
                        id: vendorId,
                        status: "Verified"
                    },
                    {
                        projection: {
                            password: 0, email: 0
                        }
                    }
                );

            if (!vendor) {

                return res.status(404).json({
                    message:
                        "Verified vendor not found."
                });
            }

            const summary =
                await reviewsCollection
                    .aggregate([
                        {
                            $match: {
                                vendorId
                            }
                        },
                        {
                            $group: {
                                _id: null,

                                averageRating: {
                                    $avg:
                                        "$rating"
                                },

                                reviewCount: {
                                    $sum: 1
                                }
                            }
                        }
                    ])
                    .toArray();

            const rating =
                summary.length > 0
                    ? {
                        averageRating:
                            Number(
                                summary[0]
                                    .averageRating
                                    .toFixed(1)
                            ),

                        reviewCount:
                            summary[0]
                                .reviewCount
                    }
                    : {
                        averageRating: 0,
                        reviewCount: 0
                    };

            res.json({
                ...vendor,
                rating
            });

        } catch (error) {

            console.error(
                "Public vendor profile error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch vendor profile."
            });
        }
    }
);


// =====================================================
// GENERATE CUSTOMER ID
// =====================================================

async function generateCustomerId() {
    let customerId;
    let exists = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;

    while (exists && attempts < MAX_ATTEMPTS) {
        attempts++;
        const number =
            Math.floor(
                1000 +
                Math.random() * 9000
            );

        customerId =
            `CUS-${number}`;

        const existing =
            await customersCollection.findOne({
                id: customerId
            });

        exists = Boolean(existing);
    }

    if (exists) {
        const fallbackId = `CUS-${Date.now().toString().slice(-6)}`;
        const fallbackExisting = await customersCollection.findOne({ id: fallbackId });
        if (!fallbackExisting) {
            return fallbackId;
        }
        return `CUS-${Date.now()}`;
    }

    return customerId;
}


// =====================================================
// CUSTOMER REGISTRATION
// =====================================================

app.post(
    "/api/customers",
    limitRegistrationAttempts,
    async (req, res) => {

        try {

            const {
                name,
                mobile,
                email,
                password,
                confirmPassword
            } = req.body;

            if (
                !name ||
                !mobile ||
                !email ||
                !password
            ) {
                return res.status(400).json({
                    message: "All fields are required."
                });
            }

            if (!allStrings(name, mobile, email, password)) {
                return res.status(400).json({
                    message: "Invalid data."
                });
            }

            if (name.trim() === "") {
                return res.status(400).json({
                    message: "Name cannot be empty."
                });
            }

            if (typeof confirmPassword !== "string" || password !== confirmPassword) {
                return res.status(400).json({
                    message: "Passwords do not match."
                });
            }

            if (!isValidMobile(mobile)) {
                return res.status(400).json({
                    message: "Mobile number must be exactly 10 digits."
                });
            }

            if (!isValidEmail(email)) {
                return res.status(400).json({
                    message: "Please enter a valid email address."
                });
            }

            if (password.length < 8) {

                return res.status(400).json({
                    message:
                        "Password must be at least 8 characters."
                });
            }

            const existing =
                await customersCollection.findOne({
                    $or: [
                        {
                            email:
                                email.trim()
                                    .toLowerCase()
                        },
                        {
                            mobile:
                                mobile.trim()
                        }
                    ]
                });

            if (existing) {

                return res.status(409).json({
                    message:
                        "Email or mobile number already registered."
                });
            }

            const customerId =
                await generateCustomerId();

            const hashedPassword =
                await hashPassword(password);

            const customer = {

                id: customerId,

                name:
                    name.trim(),

                mobile:
                    mobile.trim(),

                email:
                    email.trim()
                        .toLowerCase(),

                password:
                    hashedPassword,

                createdAt:
                    new Date()
            };

            await customersCollection.insertOne(
                customer
            );

            res.status(201).json({

                message:
                    "Customer registered successfully.",

                customerId
            });
                     } catch (error) {

            if (error && error.code === 11000) {
                return res.status(409).json({
                    message:
                        "Email or mobile number already registered."
                });
            }

            console.error(
                "Customer registration error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to register customer."
            });
        }
    }
);


// =====================================================
// CUSTOMER LOGIN
// CUSTOMER ID + PASSWORD ONLY
// =====================================================

app.post(
    "/api/customers/login",
    limitLoginAttempts,
    async (req, res) => {

        try {

            const {
                loginId,
                password
            } = req.body;

            if (!loginId || !password) {
                return res.status(400).json({
                    message: "Customer ID, email, or mobile number and password are required."
                });
            }

            if (!allStrings(loginId, password)) {
                return res.status(400).json({
                    message: "Invalid login data."
                });
            }

            const identifier = loginId.trim();
            const customer = await customersCollection.findOne({
                $or: [
                    { id: identifier },
                    { email: identifier.toLowerCase() },
                    { mobile: identifier }
                ]
            });

            if (!customer) {
                return res.status(401).json({
                    message: "Invalid ID/email/mobile or password."
                });
            }

            let valid = await verifyPassword(
                password,
                customer.password
            );

            // Legacy plaintext password support
            if (
                !valid &&
                customer.password === password
            ) {
                valid = true;
                const newPassword = await hashPassword(password);
                await customersCollection.updateOne(
                    { id: customer.id },
                    { $set: { password: newPassword } }
                );
            }

            if (!valid) {
                return res.status(401).json({
                    message: "Invalid ID/email/mobile or password."
                });
            }

            const token =
                jwt.sign(
                    {
                        id:
                            customer.id,

                        role:
                            "customer",

                        name:
                            customer.name
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: "2h"
                    }
                );

            res.json({

                message:
                    "Customer login successful.",

                token,

                role:
                    "customer",

                customer: {
                    id:
                        customer.id,

                    name:
                        customer.name
                }
            });

        } catch (error) {

            console.error(
                "Customer login error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error during customer login."
            });
        }
    }
);


// =====================================================
// CUSTOMER PROFILE
// =====================================================

app.get(
    "/api/customers/:id",
    authenticateToken,
    authorizeRole("customer"),
    async (req, res) => {

        try {

            const customerId =
                req.params.id;

            if (
                req.user.id !== customerId
            ) {

                return res.status(403).json({
                    message:
                        "You can only access your own profile."
                });
            }

            const customer =
                await customersCollection.findOne(
                    {
                        id: customerId
                    },
                    {
                        projection: {
                            password: 0
                        }
                    }
                );

            if (!customer) {

                return res.status(404).json({
                    message:
                        "Customer not found."
                });
            }

            res.json(customer);

        } catch (error) {

            console.error(
                "Customer profile error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch customer profile."
            });
        }
    }
);


// =====================================================
// ADD REVIEW
// =====================================================
// =====================================================
// ADD / UPDATE REVIEW
// ONE REVIEW PER CUSTOMER PER VENDOR
// =====================================================

app.post(
    "/api/reviews",
    authenticateToken,
    authorizeRole("customer"),
    limitReviewAttempts,
    async (req, res) => {

        try {

            // =================================================
            // GET DATA
            // =================================================

            const {
                vendorId,
                rating,
                review
            } = req.body;


            // =================================================
            // VALIDATE VENDOR ID
            // =================================================

            if (
                typeof vendorId !== "string" ||
                !vendorId.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Vendor ID is required."
                });
            }


            const cleanVendorId =
                vendorId.trim();


            // =================================================
            // VALIDATE RATING
            // =================================================

            if (
                rating === undefined ||
                rating === null ||
                rating === ""
            ) {

                return res.status(400).json({
                    message:
                        "Rating is required."
                });
            }


            const numericRating =
                Number(rating);


            if (
                !Number.isInteger(numericRating) ||
                numericRating < 1 ||
                numericRating > 5
            ) {

                return res.status(400).json({
                    message:
                        "Rating must be between 1 and 5."
                });
            }


            // =================================================
            // VALIDATE REVIEW
            // =================================================

            if (
                typeof review !== "string"
            ) {

                return res.status(400).json({
                    message:
                        "Review must be text."
                });
            }


            const cleanReview =
                review.trim();


            if (!cleanReview) {

                return res.status(400).json({
                    message:
                        "Review cannot be empty."
                });
            }


            // =================================================
            // CHECK CUSTOMER
            // =================================================

            const customer =
                await customersCollection.findOne({
                    id: req.user.id
                });


            if (!customer) {

                return res.status(404).json({
                    message:
                        "Customer account not found. Please login again."
                });
            }


            // =================================================
            // CHECK VENDOR
            // =================================================

            const vendor =
                await vendorsCollection.findOne({
                    id: cleanVendorId
                });


            if (!vendor) {

                return res.status(404).json({
                    message:
                        "Vendor not found."
                });
            }


            // =================================================
            // ONLY VERIFIED VENDOR
            // =================================================

            if (
                vendor.status !== "Verified"
            ) {

                return res.status(400).json({
                    message:
                        "You can review only verified vendors."
                });
            }


            // =================================================
            // CHECK EXISTING REVIEW
            // =================================================

            const existingReview =
                await reviewsCollection.findOne({
                    customerId:
                        req.user.id,

                    vendorId:
                        cleanVendorId
                });


            // =================================================
            // UPDATE EXISTING REVIEW
            // =================================================

            if (existingReview) {

                const updateResult =
                    await reviewsCollection.updateOne(
                        {
                            _id:
                                existingReview._id
                        },
                        {
                            $set: {

                                rating:
                                    numericRating,

                                review:
                                    cleanReview,

                                updatedAt:
                                    new Date()
                            }
                        }
                    );


                if (
                    !updateResult.acknowledged
                ) {

                    return res.status(500).json({
                        message:
                            "Review could not be updated."
                    });
                }


                console.log(
                    "Existing review updated successfully."
                );


                return res.status(200).json({

                    message:
                        "Review updated successfully.",

                    reviewId:
                        existingReview._id
                });
            }


            // =================================================
            // CREATE NEW REVIEW
            // =================================================

            const reviewDocument = {

                customerId:
                    req.user.id,

                vendorId:
                    cleanVendorId,

                rating:
                    numericRating,

                review:
                    cleanReview,

                createdAt:
                    new Date()
            };


            const result =
                await reviewsCollection.insertOne(
                    reviewDocument
                );


            if (
                !result.acknowledged
            ) {

                return res.status(500).json({
                    message:
                        "Review could not be saved."
                });
            }


            console.log(
                "New review saved successfully:",
                result.insertedId
            );


            return res.status(201).json({

                message:
                    "Review submitted successfully.",

                reviewId:
                    result.insertedId
            });


        } catch (error) {

            console.error(
                "========== ADD / UPDATE REVIEW ERROR =========="
            );

            console.error(error);


            // =================================================
            // DUPLICATE INDEX ERROR
            // =================================================

            if (
                error &&
                error.code === 11000
            ) {

                return res.status(409).json({

                    message:
                        "You have already reviewed this vendor."
                });
            }


            return res.status(500).json({

                message:
                    error.message ||
                    "Failed to submit review."
            });
        }
    }
);

// =====================================================
// GET VENDOR REVIEWS
// WITH CUSTOMER NAME
// =====================================================

app.get(
    "/api/reviews/vendor/:vendorId",
    async (req, res) => {

        try {

            const vendorId =
                req.params.vendorId;

            const page =
                Math.max(
                    parseInt(
                        req.query.page || "1",
                        10
                    ),
                    1
                );

            const limit =
                Math.min(
                    Math.max(
                        parseInt(
                            req.query.limit || "10",
                            10
                        ),
                        1
                    ),
                    50
                );


            // =============================================
            // REVIEWS + CUSTOMER NAME
            // =============================================

            const reviews =
                await reviewsCollection
                    .aggregate([

                        {
                            $match: {
                                vendorId:
                                    vendorId
                            }
                        },

                        {
                            $sort: {
                                createdAt:
                                    -1
                            }
                        },

                        {
                            $skip:
                                (page - 1) *
                                limit
                        },

                        {
                            $limit:
                                limit
                        },

                        {
                            $lookup: {

                                from:
                                    "customers",

                                localField:
                                    "customerId",

                                foreignField:
                                    "id",

                                as:
                                    "customer"
                            }
                        },

                        {
                            $unwind: {

                                path:
                                    "$customer",

                                preserveNullAndEmptyArrays:
                                    true
                            }
                        },

                        {
                            $project: {

                                _id: 1,

                                vendorId: 1,

                                rating: 1,

                                review: 1,

                                createdAt: 1,

                                customerName: {

                                    $ifNull: [
                                        "$customer.name",
                                        "Customer"
                                    ]
                                }
                            }
                        }

                    ])
                    .toArray();


            // =============================================
            // RATING SUMMARY
            // =============================================

            const summary =
                await reviewsCollection
                    .aggregate([

                        {
                            $match: {
                                vendorId:
                                    vendorId
                            }
                        },

                        {
                            $group: {

                                _id:
                                    null,

                                averageRating: {
                                    $avg:
                                        "$rating"
                                },

                                reviewCount: {
                                    $sum:
                                        1
                                }
                            }
                        }

                    ])
                    .toArray();


            let averageRating = 0;
            let reviewCount = 0;


            if (
                summary.length > 0
            ) {

                averageRating =
                    Number(
                        summary[0]
                            .averageRating
                            .toFixed(1)
                    );

                reviewCount =
                    summary[0]
                        .reviewCount;
            }


            res.json({

                averageRating,

                reviewCount,

                reviews,

                page,

                limit
            });

        } catch (error) {

            console.error(
                "Get vendor reviews error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch vendor reviews."
            });
        }
    }
);


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Server error:",
            err
        );

        if (
            err.message ===
            "Origin is not allowed by CORS."
        ) {

            return res.status(403).json({
                message:
                    "CORS origin is not allowed."
            });
        }
         if (err.type === "entity.parse.failed") {
    return res.status(400).json({
        message: "Invalid JSON in request body."
    });
}

        res.status(500).json({
            message:
                "Internal server error."
        });
    }
);


// =====================================================
// START SERVER
// =====================================================

async function startServer() {

    try {

        await client.connect();

        console.log(
            "MongoDB connected successfully!"
        );


        // =============================================
        // DATABASE INDEXES
        // =============================================

        await vendorsCollection.createIndex(
            {
                id: 1
            },
            {
                unique: true
            }
        );

        await vendorsCollection.createIndex(
            {
                email: 1
            },
            {
                unique: true
            }
        );

        await vendorsCollection.createIndex(
            {
                mobile: 1
            },
            {
                unique: true
            }
        );


        await customersCollection.createIndex(
            {
                id: 1
            },
            {
                unique: true
            }
        );

        await customersCollection.createIndex(
            {
                email: 1
            },
            {
                unique: true
            }
        );

        await customersCollection.createIndex(
            {
                mobile: 1
            },
            {
                unique: true
            }
        );


        await reviewsCollection.createIndex(
            {
                vendorId: 1,
                createdAt: -1
            }
        );

await reviewsCollection.createIndex(
    { customerId: 1, vendorId: 1 },
    {
        unique: true,
      name: "customerId_1_vendorId_1"
    }
);


        app.listen(
            PORT,
            () => {

                console.log(
                    `Server running on http://localhost:${PORT}`
                );
            }
        );

    } catch (error) {

        console.error(
            "Failed to start server:",
            error
        );

        process.exit(1);
    }
}


startServer();