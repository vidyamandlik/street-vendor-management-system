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
// AUTHENTICATION MIDDLEWARE
// ===============================

function authenticateToken(req, res, next) {

    const authHeader = req.headers.authorization;

    const token =
        authHeader &&
        authHeader.split(" ")[1];


    if (!token) {

        return res.status(401).json({
            message: "Access denied. Please login first."
        });

    }


    try {

        const user = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        req.user = user;


        next();

    } catch (error) {

        return res.status(403).json({
            message: "Invalid or expired token."
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


        // ===============================
        // ADMIN LOGIN
        // ===============================

        app.post(
            "/api/admin/login",
            async (req, res) => {

                try {

                    const {
                        username,
                        password
                    } = req.body;


                    // TEMPORARY ADMIN CREDENTIALS

                    if (
                        username === "admin" &&
                        password === "admin123"
                    ) {


                        // CREATE JWT TOKEN

                        const token = jwt.sign(

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


        // ===============================
        // GET ALL VENDORS
        // ADMIN ONLY
        // ===============================

app.get(
    "/api/vendors",
    async (req, res) => {

        try {

            const vendors =
                await db
                    .collection("vendors")
                    .find({})
                    .toArray();

            res.json(vendors);

        } catch (error) {

            console.error(
                "Error fetching vendors:",
                error
            );

            res.status(500).json({
                message: "Failed to fetch vendors"
            });

        }

    }
);

        // ===============================
        // VENDOR REGISTRATION
        // ===============================

        app.post(
            "/api/vendors",
            async (req, res) => {

                try {

                    const vendor = req.body;


                    const result =
                        await db
                            .collection("vendors")
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

 // ===============================
// GET ONE VENDOR
// VENDOR ONLY - OWN PROFILE
// ===============================

app.get(
    "/api/vendors/:id",

    authenticateToken,

    authorizeRole("vendor"),

    async (req, res) => {

        try {

            const vendorId =
                req.params.id;


            // Vendor can access only their own data

            if (req.user.id !== vendorId) {

                return res.status(403).json({

                    message:
                        "You are not authorized to access this vendor profile."

                });

            }


            const vendor =
                await db
                    .collection("vendors")
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
        
        // ===============================
        // UPDATE VENDOR
        // ===============================

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
                    const updatedVendor =
                        req.body;


                    const result =
                        await db
                            .collection("vendors")
                            .updateOne(

                                {
                                    id: vendorId
                                },

                                {
                                    $set: updatedVendor
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


        // ===============================
// VENDOR LOGIN
// ===============================

app.post(
    "/api/vendors/login",
    async (req, res) => {

        try {

            const {
                id,
                mobile
            } = req.body;


            const vendor =
                await db
                    .collection("vendors")
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


            // ===============================
            // CREATE VENDOR JWT TOKEN
            // ===============================

            const token = jwt.sign(

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

        // ===============================
        // START EXPRESS SERVER
        // ===============================

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