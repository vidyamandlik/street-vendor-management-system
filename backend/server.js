const dns = require("dns");
dns.setServers(["8.8.8.8"]);
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("streetVendorDB");
async function startServer() {
    try {
        await client.connect();

        console.log("MongoDB connected successfully!");

        app.get("/", (req, res) => {
            res.send("Street Vendor Management System Backend is running!");
        });

        app.get("/api/vendors", async (req, res) => {
    try {
        const vendors = await db.collection("vendors").find({}).toArray();
        res.json(vendors);
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({ message: "Failed to fetch vendors" });
    }
});

app.post("/api/vendors", async (req, res) => {
    try {
        const vendor = req.body;

        const result = await db.collection("vendors").insertOne(vendor);

        res.status(201).json({
            message: "Vendor registered successfully",
            vendorId: result.insertedId
        });

    } catch (error) {
        console.error("Error adding vendor:", error);
        res.status(500).json({
            message: "Failed to register vendor"
        });
    }
});

// GET ONE VENDOR
app.get("/api/vendors/:id", async (req, res) => {
    try {
        const vendorId = req.params.id;

        const vendor = await db.collection("vendors").findOne({
            id: vendorId
        });

        if (!vendor) {
            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        res.json(vendor);

    } catch (error) {
        console.error("Error fetching vendor:", error);

        res.status(500).json({
            message: "Failed to fetch vendor"
        });
    }
});


// UPDATE VENDOR
app.put("/api/vendors/:id", async (req, res) => {
    try {
        const vendorId = req.params.id;

        const updatedVendor = req.body;

        const result = await db.collection("vendors").updateOne(
            { id: vendorId },
            {
                $set: updatedVendor
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        res.json({
            message: "Vendor updated successfully"
        });

    } catch (error) {
        console.error("Error updating vendor:", error);

        res.status(500).json({
            message: "Failed to update vendor"
        });
    }
});

// ===============================
// VENDOR LOGIN
// ===============================

app.post("/api/vendors/login", async (req, res) => {
    try {

        const { id, mobile } = req.body;

        const vendor = await db.collection("vendors").findOne({
            id: id,
            mobile: mobile
        });

        if (!vendor) {
            return res.status(401).json({
                message: "Invalid Vendor ID or mobile number."
            });
        }

        res.json({
            message: "Login successful",
            vendor: vendor
        });

    } catch (error) {

        console.error("Vendor login error:", error);

        res.status(500).json({
            message: "Login failed"
        });

    }
});

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

startServer();