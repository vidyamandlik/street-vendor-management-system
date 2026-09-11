const dns = require("dns");

dns.setServers(["8.8.8.8"]);

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");

require("dotenv").config();


const app = express();

app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;


// ===============================
// MONGODB CONNECTION
// ===============================

const client = new MongoClient(process.env.MONGODB_URI);

const db = client.db("streetVendorDB");


// ===============================
// COLLECTIONS
// ===============================

const vendorsCollection =
    db.collection("vendors");

const customersCollection =
    db.collection("customers");


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
            async (req, res) => {

                try {

                    const {
                        username,
                        password
                    } = req.body;


                    // Temporary admin credentials

                    if (
                        username === "admin" &&
                        password === "admin123"
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

        app.get(
            "/api/vendors",

            authenticateToken,

            authorizeRole("admin"),

            async (req, res) => {

                try {

                    const vendors =
                        await vendorsCollection
                            .find({})
                            .toArray();


                    res.json(vendors);


                } catch (error) {

                    console.error(
                        "Error fetching vendors:",
                        error
                    );


                    res.status(500).json({

                        message:
                            "Failed to fetch vendors"

                    });

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

                    const vendor = req.body;


                    const result =
                        await vendorsCollection
                            .insertOne(vendor);


                    res.status(201).json({

                        message:
                            "Vendor registered successfully",

                        vendorId:
                            result.insertedId

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
            async (req, res) => {

                try {

                    const vendorId =
                        req.params.id;


                    const updatedVendor =
                        req.body;


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
        // VENDOR LOGIN
        // =====================================================

        app.post(
            "/api/vendors/login",
            async (req, res) => {

                try {

                    const {
                        id,
                        mobile
                    } = req.body;


                    const vendor =
                        await vendorsCollection
                            .findOne({

                                id: id,

                                mobile: mobile

                            });


                    if (!vendor) {

                        return res.status(401).json({

                            message:
                                "Invalid Vendor ID or mobile number."

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

                                password: 0

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

                    const customerId =
                        "CUS-" +
                        Math.floor(
                            1000 +
                            Math.random() * 9000
                        );


                    // Customer object

                    const customer = {

                        id: customerId,

                        name: name,

                        mobile: mobile,

                        email: email,

                        password: password,

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

                    if (
                        customer.password !== password
                    ) {

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