const dns = require("dns");

dns.setServers(["8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const { randomUUID, randomBytes, scrypt, timingSafeEqual } = require("crypto");
const { promisify } = require("util");

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in backend/.env.");
}

const scryptAsync = promisify(scrypt);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5500,http://127.0.0.1:5500")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scryptAsync(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedPassword) {
    if (typeof storedPassword !== "string" || !storedPassword.includes(":")) {
        return false;
    }

    const [salt, storedHash] = storedPassword.split(":");
    const derivedKey = await scryptAsync(password, salt, 64);
    const storedKey = Buffer.from(storedHash, "hex");
    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}


const app = express();

app.use(cors({
    origin(origin, callback) {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS."));
    }
}));
app.use(express.json());

const loginAttempts = new Map();
function limitLoginAttempts(req, res, next) {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 10;
    const attempts = (loginAttempts.get(key) || []).filter(time => now - time < windowMs);

    if (attempts.length >= maxAttempts) {
        return res.status(429).json({ message: "Too many login attempts. Please try again later." });
    }

    res.on("finish", () => {
        if (res.statusCode >= 400 && res.statusCode < 500) {
            attempts.push(now);
            loginAttempts.set(key, attempts);
        }
    });
    next();
}


const PORT = process.env.PORT || 5000;


// ===============================
// MONGODB CONNECTION
// ===============================

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(MONGODB_URI);

const db = client.db("streetVendorDB");


// ===============================
// COLLECTIONS
// ===============================

const vendorsCollection =
    db.collection("vendors");

const customersCollection =
    db.collection("customers");

const reviewsCollection =
    db.collection("reviews");


// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================

function authenticateToken(req, res, next) {

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


// ===============================
// ROLE AUTHORIZATION MIDDLEWARE
// ===============================

function authorizeRole(role) {

    return (req, res, next) => {

        if (req.user.role !== role) {

            return res.status(403).json({

                message:
                    "You are not authorized to access this resource."

            });

        }


        next();

    };

}


// ===============================
// START SERVER
// ===============================

async function startServer() {

    try {

        await client.connect();

        await Promise.all([
            vendorsCollection.createIndex({ id: 1 }, { unique: true }),
            vendorsCollection.createIndex({ email: 1 }, { unique: true }),
            vendorsCollection.createIndex({ mobile: 1 }, { unique: true }),
            customersCollection.createIndex({ id: 1 }, { unique: true }),
            customersCollection.createIndex({ email: 1 }, { unique: true }),
            customersCollection.createIndex({ mobile: 1 }, { unique: true }),
            reviewsCollection.createIndex({ vendorId: 1, createdAt: -1 })
        ]);


        console.log(
            "MongoDB connected successfully!"
        );


        // ===============================
        // HOME ROUTE
        // ===============================

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


                    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
                        return res.status(503).json({ message: "Admin login is not configured." });
                    }

                    if (
                        username === process.env.ADMIN_USERNAME &&
                        await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH)
                    ) {

                        const token =
                            jwt.sign(

                                {
                                    username: username,
                                    role: "admin"
                                },

                                process.env.JWT_SECRET,

                                {
                                    expiresIn: "2h"
                                }

                            );


                        return res.json({

                            message:
                                "Admin login successful",

                            token: token,

                            role: "admin"

                        });

                    }


                    return res.status(401).json({

                        message:
                            "Invalid username or password."

                    });


                } catch (error) {

                    console.error(
                        "Admin login error:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Admin login failed."

                    });

                }

            }
        );


        // =====================================================
        // GET ALL VENDORS
        // ADMIN ONLY
        // =====================================================
// PUBLIC VERIFIED VENDORS - FOR DIRECTORY
app.get("/api/vendors", async (req, res) => {
    try {
        const vendors = await db
            .collection("vendors")
            .find({ status: "Verified" })
            .project({
                _id: 0,
                id: 1,
                name: 1,
                businessName: 1,
                category: 1,
                district: 1,
                years: 1,
                description: 1
            })
            .toArray();

        res.json(vendors);

    } catch (error) {
        console.error("Error fetching vendors:", error);

        res.status(500).json({
            message: "Failed to fetch vendors"
        });
    }
});

// GET ALL VENDORS
// ADMIN ONLY
app.get(
    "/api/admin/vendors",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res) => {
        try {
            const vendors = await vendorsCollection
                .find({})
                .project({ password: 0 })
                .toArray();

            res.json(vendors);
        } catch (error) {
            console.error("Error fetching admin vendor data:", error);
            res.status(500).json({ message: "Failed to fetch vendors" });
        }
    }
);

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
                        businessName,
                        category,
                        district,
                        address,
                        years,
                        description,
                        password
                    } = req.body;

                    if (!name || !mobile || !email || !businessName || !category || !district || !address || !password) {
                        return res.status(400).json({
                            message: "All required vendor details must be provided."
                        });
                    }

                    // Assign identity and approval state on the server so clients cannot forge them.
                    const existingVendor = await vendorsCollection.findOne({
                        $or: [{ email }, { mobile }]
                    });

                    if (existingVendor) {
                        return res.status(409).json({ message: "A vendor with this email or mobile already exists." });
                    }

                    const vendor = {
                        id: `VND-${randomUUID()}`,
                        name,
                        mobile,
                        email,
                        businessName,
                        category,
                        district,
                        address,
                        years,
                        description,
                        password: await hashPassword(password),
                        status: "Pending",
                        createdAt: new Date()
                    };


                    const result =
                        await vendorsCollection
                            .insertOne(vendor);


                    res.status(201).json({

                        message:
                            "Vendor registered successfully",

                        vendorId: vendor.id

                    });


                } catch (error) {

                    console.error(
                        "Error adding vendor:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Failed to register vendor"

                    });

                }

            }
        );


        // =====================================================
        // GET ONE VENDOR
        // VENDOR ONLY - OWN PROFILE
        // =====================================================

        app.get(
            "/api/vendors/:id",

            authenticateToken,

            authorizeRole("vendor"),

            async (req, res) => {

                try {

                    const vendorId =
                        req.params.id;


                    // Vendor can access only own profile

                    if (
                        req.user.id !== vendorId
                    ) {

                        return res.status(403).json({

                            message:
                                "You are not authorized to access this vendor profile."

                        });

                    }


                    const vendor =
                        await vendorsCollection
                            .findOne({

                                id: vendorId

                            });


                    if (!vendor) {

                        return res.status(404).json({

                            message:
                                "Vendor not found"

                        });

                    }


                    res.json(vendor);


                } catch (error) {

                    console.error(
                        "Error fetching vendor:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Failed to fetch vendor"

                    });

                }

            }
        );


        // =====================================================
        // UPDATE VENDOR
        // =====================================================

        app.put(
                 "/api/vendors/:id",
                authenticateToken,
                authorizeRole("vendor"),
                async (req, res) => {
                try {

                    const vendorId =
                        req.params.id;
                       // Vendor can update only their own profile
                       if (req.user.id !== vendorId) {

                        return res.status(403).json({
                    message:
                    "You are not authorized to update this vendor profile."
             });

           }
                    const editableFields = [
                        "name",
                        "mobile",
                        "email",
                        "businessName",
                        "category",
                        "district",
                        "address",
                        "years",
                        "description"
                    ];

                    const updatedVendor = Object.fromEntries(
                        editableFields
                            .filter(field => Object.prototype.hasOwnProperty.call(req.body, field))
                            .map(field => [field, req.body[field]])
                    );

                    if (Object.keys(updatedVendor).length === 0) {
                        return res.status(400).json({
                            message: "No editable vendor details were provided."
                        });
                    }


                    const result =
                        await vendorsCollection
                            .updateOne(

                                {
                                    id: vendorId
                                },

                                {
                                    $set:
                                        updatedVendor
                                }

                            );


                    if (
                        result.matchedCount === 0
                    ) {

                        return res.status(404).json({

                            message:
                                "Vendor not found"

                        });

                    }


                    res.json({

                        message:
                            "Vendor updated successfully"

                    });


                } catch (error) {

                    console.error(
                        "Error updating vendor:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Failed to update vendor"

                    });

                }

            }
        );

        // =====================================================
// ADMIN UPDATE VENDOR STATUS
// ADMIN ONLY
// =====================================================

app.put(
    "/api/admin/vendors/:id/status",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res) => {

        try {

            const vendorId = req.params.id;
            const { status } = req.body;

            // Only allow valid statuses
            if (
                status !== "Verified" &&
                status !== "Rejected" &&
                status !== "Pending"
            ) {

                return res.status(400).json({
                    message: "Invalid vendor status."
                });

            }

            const result =
                await vendorsCollection.updateOne(
                    { id: vendorId },
                    {
                        $set: {
                            status: status
                        }
                    }
                );

            if (result.matchedCount === 0) {

                return res.status(404).json({
                    message: "Vendor not found."
                });

            }

            res.json({
                message: `Vendor ${status.toLowerCase()} successfully.`
            });

        } catch (error) {

            console.error(
                "Admin vendor status update error:",
                error
            );

            res.status(500).json({
                message: "Failed to update vendor status."
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


                    const vendor =
                        await vendorsCollection
                            .findOne({

                                id: id

                            });


                    if (!vendor || !await verifyPassword(password, vendor.password)) {

                        return res.status(401).json({

                            message:
                                "Invalid Vendor ID or password."

                        });

                    }


                    // Create Vendor JWT

                    const token =
                        jwt.sign(

                            {

                                id: vendor.id,

                                role: "vendor"

                            },

                            process.env.JWT_SECRET,

                            {

                                expiresIn: "2h"

                            }

                        );


                    res.json({

                        message:
                            "Login successful",

                        token: token,

                        role: "vendor",

                        vendor: {

                            id: vendor.id,

                            name: vendor.name

                        }

                    });


                } catch (error) {

                    console.error(
                        "Vendor login error:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Login failed"

                    });

                }

            }
        );


        // =====================================================
        // PUBLIC VERIFIED VENDORS
        // CUSTOMER CAN ACCESS
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
                                _id: 0,
                                id: 1,
                                name: 1,
                                businessName: 1,
                                category: 1,
                                district: 1,
                                years: 1,
                                description: 1
                            })
                            .toArray();


                    res.json(vendors);


                } catch (error) {

                    console.error(
                        "Error loading verified vendors:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Failed to load verified vendors"

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


                    // Check required fields

                    if (
                        !name ||
                        !mobile ||
                        !email ||
                        !password
                    ) {

                        return res.status(400).json({

                            message:
                                "All fields are required"

                        });

                    }


                    // Check existing customer

                    const existingCustomer =
                        await customersCollection.findOne({

                            $or: [

                                {
                                    email: email
                                },

                                {
                                    mobile: mobile
                                }

                            ]

                        });


                    if (existingCustomer) {

                        return res.status(409).json({

                            message:
                                "Customer with this email or mobile already exists"

                        });

                    }


                    // Generate Customer ID

                    const customerId = `CUS-${randomUUID()}`;


                    // Customer object

                    const customer = {

                        id: customerId,

                        name: name,

                        mobile: mobile,

                        email: email,

                        password: await hashPassword(password),

                        createdAt: new Date()

                    };


                    // Save customer

                    await customersCollection
                        .insertOne(customer);


                    res.status(201).json({

                        message:
                            "Customer registered successfully",

                        customer: {

                            id: customerId,

                            name: name,

                            email: email

                        }

                    });


                } catch (error) {

                    console.error(
                        "Customer registration error:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Server error during customer registration"

                    });

                }

            }
        );


        // =====================================================
        // CUSTOMER LOGIN
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


                    // Check input

                    if (
                        !loginId ||
                        !password
                    ) {

                        return res.status(400).json({

                            message:
                                "Email/mobile and password are required"

                        });

                    }


                    // Find customer by email OR mobile

                    const customer =
                        await customersCollection.findOne({

                            $or: [

                                {
                                    email: loginId
                                },

                                {
                                    mobile: loginId
                                }

                            ]

                        });


                    // Customer not found

                    if (!customer) {

                        return res.status(401).json({

                            message:
                                "Invalid email/mobile or password"

                        });

                    }


                    // Check password

                    let passwordIsValid = await verifyPassword(password, customer.password);

                    // Upgrade legacy plaintext records on their next successful login.
                    if (!passwordIsValid && customer.password === password) {
                        passwordIsValid = true;
                        await customersCollection.updateOne(
                            { _id: customer._id },
                            { $set: { password: await hashPassword(password) } }
                        );
                    }

                    if (!passwordIsValid) {

                        return res.status(401).json({

                            message:
                                "Invalid email/mobile or password"

                        });

                    }


                    // Create Customer JWT

                    const token =
                        jwt.sign(

                            {

                                id: customer.id,

                                role: "customer"

                            },

                            process.env.JWT_SECRET,

                            {

                                expiresIn: "2h"

                            }

                        );


                    res.json({

                        message:
                            "Customer login successful",

                        token: token,

                        role: "customer",

                        customer: {

                            id: customer.id,

                            name: customer.name,

                            email: customer.email

                        }

                    });


                } catch (error) {

                    console.error(
                        "Customer login error:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Server error during customer login"

                    });

                }

            }
        );


        // =====================================================
        // GET CUSTOMER PROFILE
        // CUSTOMER ONLY
        // =====================================================

        app.get(
            "/api/customers/:id",

            authenticateToken,

            authorizeRole("customer"),

            async (req, res) => {

                try {

                    const customerId =
                        req.params.id;


                    // Customer can access only own profile

                    if (
                        req.user.id !== customerId
                    ) {

                        return res.status(403).json({

                            message:
                                "You are not authorized to access this profile."

                        });

                    }


                    const customer =
                        await customersCollection
                            .findOne(

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
                                "Customer not found"

                        });

                    }


                    res.json(customer);


                } catch (error) {

                    console.error(
                        "Error fetching customer:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Failed to fetch customer profile"

                    });

                }

            }
        );

        // =====================================================
// ADD RATING & REVIEW
// CUSTOMER ONLY
// =====================================================

app.post(
    "/api/reviews",
    authenticateToken,
    authorizeRole("customer"),
    async (req, res) => {

        try {

            const {
                vendorId,
                rating,
                review
            } = req.body;


            // Check required fields

            if (
                !vendorId ||
                !rating ||
                !review
            ) {

                return res.status(400).json({

                    message:
                        "Vendor ID, rating and review are required"

                });

            }


            // Check rating

            if (
                rating < 1 ||
                rating > 5
            ) {

                return res.status(400).json({

                    message:
                        "Rating must be between 1 and 5"

                });

            }


            // Check vendor exists

            const vendor =
                await vendorsCollection.findOne({

                    id: vendorId,

                    status: "Verified"

                });


            if (!vendor) {

                return res.status(404).json({

                    message:
                        "Verified vendor not found"

                });

            }


            // Create review

            const newReview = {

                customerId: req.user.id,

                vendorId: vendorId,

                rating: Number(rating),

                review: review.trim(),

                createdAt: new Date()

            };


            // Save review

            const result =
                await reviewsCollection.insertOne(
                    newReview
                );


            res.status(201).json({

                message:
                    "Rating and review submitted successfully",

                review: {

                    _id: result.insertedId,

                    customerId:
                        newReview.customerId,

                    vendorId:
                        newReview.vendorId,

                    rating:
                        newReview.rating,

                    review:
                        newReview.review,

                    createdAt:
                        newReview.createdAt

                }

            });


        } catch (error) {

            console.error(
                "Review submission error:",
                error
            );


            res.status(500).json({

                message:
                    "Failed to submit rating and review"

            });

        }

    }
);

// =====================================================
// GET VENDOR REVIEWS
// PUBLIC
// =====================================================

app.get(
    "/api/reviews/vendor/:vendorId",
    async (req, res) => {

        try {

            const vendorId =
                req.params.vendorId;

            const requestedPage = Number.parseInt(req.query.page, 10) || 1;
            const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
            const page = Math.max(1, requestedPage);
            const limit = Math.min(50, Math.max(1, requestedLimit));


            // Get all reviews for this vendor

            const [reviews, summary] = await Promise.all([
                reviewsCollection
                    .find({ vendorId: vendorId })
                    .project({ customerId: 0 })
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .toArray(),
                reviewsCollection.aggregate([
                    { $match: { vendorId: vendorId } },
                    { $group: { _id: null, averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }
                ]).toArray()
            ]);


            // No reviews

            if (summary.length === 0) {

                return res.json({

                    averageRating: 0,

                    reviewCount: 0,
                    reviews: [],
                    page,
                    limit

                });

            }


            // Calculate total rating

            const { averageRating, reviewCount } = summary[0];


            res.json({

                averageRating:
                    Number(
                        averageRating.toFixed(1)
                    ),

                reviewCount: reviewCount,

                reviews:
                    reviews,

                page,
                limit

            });


        } catch (error) {

            console.error(
                "Error fetching vendor reviews:",
                error
            );


            res.status(500).json({

                message:
                    "Failed to load vendor reviews"

            });

        }

    }
);
        // =====================================================
        // START EXPRESS SERVER
        // =====================================================

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
            "MongoDB connection failed:",
            error
        );

    }

}


startServer();
