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

            console.log("REQUEST ORIGIN:", origin);

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

function allStrings(...values) {
    return values.every(v => typeof v === "string");
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
// MONGODB
// =====================================================

const client =
    new MongoClient(MONGODB_URI);

const db =
    client.db("streetVendorDB");

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
                        password: 0
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
                        password: 0
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
    async (req, res) => {

        try {

            const {
                name,
                mobile,
                email,
                password,
                businessName,
                category,
                district,
                address,
                years,
                description
            } = req.body;

            if (
                !name ||
                !mobile ||
                !email ||
                !password ||
                !businessName ||
                !category ||
                !district ||
                !address ||
                years === undefined ||
                years === null ||
                !description
            ) {

                return res.status(400).json({
                    message:
                        "All required fields must be filled."
                });
            }
            if (!allStrings(name, mobile, email, password,
                businessName, category, district,
                address, description)) {
    return res.status(400).json({
        message: "Invalid data in the form."
    });
}

if (!isValidMobile(mobile)) {
    return res.status(400).json({
        message: "Mobile number must be exactly 10 digits."
    });
}

const yearsNumber = Number(years);
if (!Number.isFinite(yearsNumber) || yearsNumber < 0 || yearsNumber > 100) {
    return res.status(400).json({
        message: "Years must be a number between 0 and 100."
    });
}

            if (password.length < 8) {

                return res.status(400).json({
                    message:
                        "Password must be at least 8 characters."
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

            const vendorId =
                await generateVendorId();

            const hashedPassword =
                await hashPassword(password);

            const vendor = {

                id: vendorId,

                name: name.trim(),

                mobile: mobile.trim(),

                email: email.trim().toLowerCase(),

                password: hashedPassword,

                businessName:
                    businessName.trim(),

                category:
                    category.trim(),

                district:
                    district.trim(),

                address:
                    address.trim(),

                years:
                    Number(years),

                description:
                    description.trim(),

                status: "Pending",

                createdAt: new Date()
            };

            await vendorsCollection.insertOne(
                vendor
            );

            res.status(201).json({
                message:
                    "Vendor registered successfully. Your account is pending verification.",
                vendorId
            });

        } catch (error) {

               if (error && error.code === 11000) {
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
  if (mobile !== undefined && !isValidMobile(mobile)) {
      return res.status(400).json({ message: "Mobile number must be exactly 10 digits." });
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
                    district.trim();

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
                closingTime
            } = req.body;

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

            // Save shop details
            const result =
                await vendorsCollection.updateOne(
                    {
                        id: vendorId
                    },
                    {
                        $set: {
                            shopDetails: {

                                // Opening days
                                days: days,

                                // Closing day
                                closingDay:
                                    closingDay.trim(),

                                // Products
                                products: products,

                                // Opening time
                                openingTime:
                                    openingTime.trim(),

                                // Closing time
                                closingTime:
                                    closingTime.trim(),

                                // Last updated
                                updatedAt:
                                    new Date()
                            }
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
                shopDetails: {
                    days,
                    closingDay:
                        closingDay.trim(),
                    products,
                    openingTime:
                        openingTime.trim(),
                    closingTime:
                        closingTime.trim()
                }
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

            if (
                !id ||
                !password
            ) 
              if (!allStrings(id, password)) {
               return res.status(400).json({ message: "Invalid login data." });
             }
            {

                return res.status(400).json({
                    message:
                        "Vendor ID and password are required."
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
                        password: 0
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
                            password: 0
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
// CUSTOMER REGISTRATION
// =====================================================

app.post(
    "/api/customers",
    async (req, res) => {

        try {

            const {
                name,
                mobile,
                email,
                password
            } = req.body;

            if (
                !name ||
                !mobile ||
                !email ||
                !password
            ) 
            if (!allStrings(name, mobile, email, password)) { return res.status(400).json({ message: "Invalid data." }); } 
             if (!isValidMobile(mobile)) { return res.status(400).json({ message: "Mobile number must be exactly 10 digits." }); }
            {

                return res.status(400).json({
                    message:
                        "All fields are required."
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
                `CUS-${randomUUID()}`;

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

            if (
                !loginId ||
                !password
            ) if (!allStrings(loginId, password)) { return res.status(400).json({ message: "Invalid login data." }); }
            
            {

                return res.status(400).json({
                    message:
                        "Customer ID and password are required."
                });
            }

            const customer =
                await customersCollection.findOne({
                    id: loginId.trim()
                });

            if (!customer) {

                return res.status(401).json({
                    message:
                        "Invalid Customer ID or password."
                });
            }

            let valid =
                await verifyPassword(
                    password,
                    customer.password
                );

            // Legacy plaintext password support
            if (
                !valid &&
                customer.password === password
            ) {

                valid = true;

                const newPassword =
                    await hashPassword(password);

                await customersCollection.updateOne(
                    {
                        id:
                            customer.id
                    },
                    {
                        $set: {
                            password:
                                newPassword
                        }
                    }
                );
            }

            if (!valid) {

                return res.status(401).json({
                    message:
                        "Invalid Customer ID or password."
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
    async (req, res) => {

        try {

            console.log("========== ADD / UPDATE REVIEW ==========");
            console.log("USER:", req.user);
            console.log("BODY:", req.body);


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
           { unique: true }
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